import { createHash } from "node:crypto";
import {
  PREDICTIVE_DATASET_HORIZONS,
  PredictiveDatasetRecord,
  PredictiveHorizon,
} from "../dataset/PredictiveDatasetTypes";
import {
  CandidateModelArtifact,
  EvaluatePredictiveModelsOptions,
  HorizonEvaluation,
  PREDICTIVE_MODEL_SEED,
  PREDICTIVE_MODEL_VERSION,
  PredictiveEvaluationRow,
  PredictiveMetrics,
  PredictiveModelRun,
  RegressionTreeArtifact,
  RegressionTreeNode,
  RidgeModelArtifact,
} from "./PredictiveModelTypes";

const RIDGE_LAMBDAS = [0.1, 1, 10] as const;
const TREE_DEPTHS = [2, 3, 4] as const;
const TREE_MIN_LEAF = 12;

const round = (value: number, decimals = 6): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const stableStringify = (value: unknown): string => {
  if (value === undefined || value === null) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
};

const sha256 = (value: unknown): string =>
  createHash("sha256").update(stableStringify(value)).digest("hex");

const predictionCount = (value: number): number =>
  Math.max(0, Math.round(Number.isFinite(value) ? value : 0));

export const calculatePredictiveMetrics = (
  rows: PredictiveEvaluationRow[],
): PredictiveMetrics => {
  if (rows.length === 0) {
    return { count: 0, mae: 0, rmse: 0, wape: null, actualTotal: 0, predictedTotal: 0 };
  }
  const absoluteErrors = rows.map((row) => Math.abs(row.actual - row.predicted));
  const squaredErrors = rows.map((row) => (row.actual - row.predicted) ** 2);
  const actualTotal = rows.reduce((sum, row) => sum + row.actual, 0);
  const predictedTotal = rows.reduce((sum, row) => sum + row.predicted, 0);
  const absoluteTotal = absoluteErrors.reduce((sum, value) => sum + value, 0);
  return {
    count: rows.length,
    mae: round(absoluteTotal / rows.length),
    rmse: round(Math.sqrt(squaredErrors.reduce((sum, value) => sum + value, 0) / rows.length)),
    wape: actualTotal === 0 ? null : round(absoluteTotal / actualTotal),
    actualTotal,
    predictedTotal,
  };
};

const numericFeatureNames = [
  "confirmedTourists", "confirmedBookings", "averageGroupSize",
  "last7Tourists", "last14Tourists", "last7Rate", "last14Rate",
  "salesAgeDays", "daysUntilDeparture", "departureMonth", "departureIsoWeek",
  "departureDayOfWeek", "durationDays", "packagePrice", "capacity",
  "historicalDepartures", "historicalOccupancy",
] as const;

interface FeatureEncoder {
  featureNames: string[];
  categories: {
    package: string[];
    destination: string[];
    type: string[];
    season: string[];
  };
}

const category = (value: string | null): string => value ?? "__missing__";

const fitEncoder = (records: PredictiveDatasetRecord[]): FeatureEncoder => {
  const unique = (values: string[]) => [...new Set(values)].sort();
  const categories = {
    package: unique(records.map((record) => record.features.tourPackageId)),
    destination: unique(records.map((record) => category(record.features.destinationId))),
    type: unique(records.map((record) => category(record.features.tourTypeId))),
    season: unique(records.map((record) => record.features.season)),
  };
  return {
    categories,
    featureNames: [
      ...numericFeatureNames,
      ...categories.package.map((value) => `package:${value}`),
      ...categories.destination.map((value) => `destination:${value}`),
      ...categories.type.map((value) => `type:${value}`),
      ...categories.season.map((value) => `season:${value}`),
    ],
  };
};

const rawFeatures = (record: PredictiveDatasetRecord, encoder: FeatureEncoder): number[] => {
  const features = record.features;
  const numeric = [
    features.confirmedTourists,
    features.confirmedBookings,
    features.averageGroupSize ?? 0,
    features.rhythm.last7Days.tourists,
    features.rhythm.last14Days.tourists,
    features.rhythm.last7Days.touristsPerDay,
    features.rhythm.last14Days.touristsPerDay,
    features.salesAgeDays ?? 0,
    features.daysUntilDeparture,
    features.departureMonth,
    features.departureIsoWeek,
    features.departureDayOfWeek,
    features.durationDays ?? 0,
    features.packagePrice ?? 0,
    features.capacity,
    features.historicalPackage.completedDepartures,
    features.historicalPackage.averageFinalOccupancy ?? 0,
  ];
  const oneHot = (values: string[], current: string) =>
    values.map((value) => (value === current ? 1 : 0));
  return [
    ...numeric,
    ...oneHot(encoder.categories.package, features.tourPackageId),
    ...oneHot(encoder.categories.destination, category(features.destinationId)),
    ...oneHot(encoder.categories.type, category(features.tourTypeId)),
    ...oneHot(encoder.categories.season, features.season),
  ];
};

const solveLinearSystem = (matrix: number[][], values: number[]): number[] => {
  const size = values.length;
  const augmented = matrix.map((row, index) => [...row, values[index]]);
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    if (Math.abs(augmented[column][column]) < 1e-10) augmented[column][column] = 1e-10;
    const divisor = augmented[column][column];
    for (let item = column; item <= size; item += 1) augmented[column][item] /= divisor;
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let item = column; item <= size; item += 1) {
        augmented[row][item] -= factor * augmented[column][item];
      }
    }
  }
  return augmented.map((row) => row[size]);
};

const trainRidge = (records: PredictiveDatasetRecord[], lambda: number): RidgeModelArtifact => {
  const encoder = fitEncoder(records);
  const raw = records.map((record) => rawFeatures(record, encoder));
  const width = encoder.featureNames.length;
  const means = Array.from({ length: width }, (_, index) =>
    raw.reduce((sum, row) => sum + row[index], 0) / raw.length,
  );
  const scales = Array.from({ length: width }, (_, index) => {
    const variance = raw.reduce((sum, row) => sum + (row[index] - means[index]) ** 2, 0) / raw.length;
    const scale = Math.sqrt(variance);
    return scale > 1e-9 ? scale : 1;
  });
  const x = raw.map((row) => [1, ...row.map((value, index) => (value - means[index]) / scales[index])]);
  const y = records.map((record) => record.labelFinalTourists);
  const size = width + 1;
  const xtx = Array.from({ length: size }, () => Array(size).fill(0) as number[]);
  const xty = Array(size).fill(0) as number[];
  for (let row = 0; row < x.length; row += 1) {
    for (let left = 0; left < size; left += 1) {
      xty[left] += x[row][left] * y[row];
      for (let right = 0; right < size; right += 1) xtx[left][right] += x[row][left] * x[row][right];
    }
  }
  for (let index = 1; index < size; index += 1) xtx[index][index] += lambda;
  return {
    kind: "ridge", lambda, featureNames: encoder.featureNames, means, scales,
    coefficients: solveLinearSystem(xtx, xty).map((value) => round(value, 10)),
  };
};

const encoderFromArtifact = (featureNames: string[]): FeatureEncoder => ({
  featureNames,
  categories: {
    package: featureNames.filter((name) => name.startsWith("package:")).map((name) => name.slice(8)),
    destination: featureNames.filter((name) => name.startsWith("destination:")).map((name) => name.slice(12)),
    type: featureNames.filter((name) => name.startsWith("type:")).map((name) => name.slice(5)),
    season: featureNames.filter((name) => name.startsWith("season:")).map((name) => name.slice(7)),
  },
});

const predictRidge = (artifact: RidgeModelArtifact, record: PredictiveDatasetRecord): number => {
  const raw = rawFeatures(record, encoderFromArtifact(artifact.featureNames));
  const prediction = artifact.coefficients[0] + raw.reduce(
    (sum, value, index) => sum + ((value - artifact.means[index]) / artifact.scales[index]) * artifact.coefficients[index + 1],
    0,
  );
  return predictionCount(prediction);
};

const varianceLoss = (values: number[]): number => {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0);
};

const buildTree = (
  rows: Array<{ x: number[]; y: number }>,
  depth: number,
  maxDepth: number,
  minLeaf: number,
): RegressionTreeNode => {
  const prediction = rows.reduce((sum, row) => sum + row.y, 0) / rows.length;
  const node: RegressionTreeNode = { prediction: round(prediction, 10), count: rows.length };
  if (depth >= maxDepth || rows.length < minLeaf * 2) return node;
  let best: { feature: number; threshold: number; loss: number } | null = null;
  for (let feature = 0; feature < rows[0].x.length; feature += 1) {
    const values = [...new Set(rows.map((row) => row.x[feature]))].sort((a, b) => a - b);
    for (let index = 1; index < values.length; index += 1) {
      const threshold = (values[index - 1] + values[index]) / 2;
      const left = rows.filter((row) => row.x[feature] <= threshold);
      const right = rows.filter((row) => row.x[feature] > threshold);
      if (left.length < minLeaf || right.length < minLeaf) continue;
      const loss = varianceLoss(left.map((row) => row.y)) + varianceLoss(right.map((row) => row.y));
      if (best === null || loss < best.loss - 1e-9) best = { feature, threshold, loss };
    }
  }
  if (best === null) return node;
  const left = rows.filter((row) => row.x[best!.feature] <= best!.threshold);
  const right = rows.filter((row) => row.x[best!.feature] > best!.threshold);
  return {
    ...node,
    featureIndex: best.feature,
    threshold: round(best.threshold, 10),
    left: buildTree(left, depth + 1, maxDepth, minLeaf),
    right: buildTree(right, depth + 1, maxDepth, minLeaf),
  };
};

const trainTree = (records: PredictiveDatasetRecord[], maxDepth: number): RegressionTreeArtifact => {
  const encoder = fitEncoder(records);
  return {
    kind: "regression-tree",
    maxDepth,
    minLeaf: TREE_MIN_LEAF,
    featureNames: encoder.featureNames,
    root: buildTree(records.map((record) => ({ x: rawFeatures(record, encoder), y: record.labelFinalTourists })), 0, maxDepth, TREE_MIN_LEAF),
  };
};

const predictTree = (artifact: RegressionTreeArtifact, record: PredictiveDatasetRecord): number => {
  const features = rawFeatures(record, encoderFromArtifact(artifact.featureNames));
  let node = artifact.root;
  while (node.featureIndex !== undefined && node.threshold !== undefined && node.left && node.right) {
    node = features[node.featureIndex] <= node.threshold ? node.left : node.right;
  }
  return predictionCount(node.prediction);
};

const evaluate = (
  records: PredictiveDatasetRecord[],
  predictor: (record: PredictiveDatasetRecord) => number,
): PredictiveMetrics => calculatePredictiveMetrics(records.map((record) => ({
  key: record.key,
  departureId: record.departureId,
  horizonDays: record.horizonDays,
  actual: record.labelFinalTourists,
  predicted: predictor(record),
})));

const historicalBaseline = (record: PredictiveDatasetRecord): number => {
  const occupancy = record.features.historicalPackage.averageFinalOccupancy;
  if (occupancy === null) return record.features.confirmedTourists;
  return predictionCount(Math.max(record.features.confirmedTourists, occupancy * record.features.capacity));
};

export const predictWithArtifact = (
  artifact: CandidateModelArtifact,
  record: PredictiveDatasetRecord,
): number =>
  artifact.kind === "ridge"
    ? predictRidge(artifact, record)
    : predictTree(artifact, record);

export const predictAccumulatedBaseline = (
  record: PredictiveDatasetRecord,
): number => record.features.confirmedTourists;

export const predictHistoricalRemainingBaseline = historicalBaseline;

const improvement = (baseline: number, candidate: number): number =>
  baseline === 0 ? 0 : round(((baseline - candidate) / baseline) * 100, 4);

const evaluateHorizon = (
  records: PredictiveDatasetRecord[],
  horizon: PredictiveHorizon,
): HorizonEvaluation => {
  const scoped = records.filter((record) => record.horizonDays === horizon);
  const train = scoped.filter((record) => record.split === "train");
  const validation = scoped.filter((record) => record.split === "validation");
  const test = scoped.filter((record) => record.split === "test");
  if (train.length === 0 || validation.length === 0 || test.length === 0) {
    throw new Error(`El horizonte ${horizon} requiere train, validation y test no vacíos`);
  }

  const candidates = [
    ...RIDGE_LAMBDAS.map((lambda) => {
      const artifact = trainRidge(train, lambda);
      return { model: "ridge" as const, configuration: { lambda }, validation: evaluate(validation, (record) => predictRidge(artifact, record)) };
    }),
    ...TREE_DEPTHS.map((maxDepth) => {
      const artifact = trainTree(train, maxDepth);
      return { model: "regression-tree" as const, configuration: { maxDepth, minLeaf: TREE_MIN_LEAF }, validation: evaluate(validation, (record) => predictTree(artifact, record)) };
    }),
  ].sort((left, right) => left.validation.mae - right.validation.mae || left.model.localeCompare(right.model) || stableStringify(left.configuration).localeCompare(stableStringify(right.configuration)));

  const winner = candidates[0];
  const finalTraining = [...train, ...validation];
  const artifact: CandidateModelArtifact = winner.model === "ridge"
    ? trainRidge(finalTraining, winner.configuration.lambda)
    : trainTree(finalTraining, winner.configuration.maxDepth);
  const testMetrics = evaluate(test, (record) =>
    artifact.kind === "ridge" ? predictRidge(artifact, record) : predictTree(artifact, record),
  );
  const accumulatedValidation = evaluate(validation, (record) => record.features.confirmedTourists);
  const accumulatedTest = evaluate(test, (record) => record.features.confirmedTourists);
  const historicalValidation = evaluate(validation, historicalBaseline);
  const historicalTest = evaluate(test, historicalBaseline);
  const improvementAccumulated = improvement(accumulatedTest.mae, testMetrics.mae);
  const improvementHistorical = improvement(historicalTest.mae, testMetrics.mae);
  const improvesValidation =
    winner.validation.mae < accumulatedValidation.mae &&
    winner.validation.mae < historicalValidation.mae;
  const improvesTest = improvementAccumulated > 0 && improvementHistorical > 0;
  const stableImprovement = improvesValidation && improvesTest;
  const bestBaseline = accumulatedValidation.mae <= historicalValidation.mae
    ? {
        predictor: "baseline-accumulated" as const,
        validation: accumulatedValidation,
        test: accumulatedTest,
      }
    : {
        predictor: "baseline-historical-remaining" as const,
        validation: historicalValidation,
        test: historicalTest,
      };

  return {
    horizonDays: horizon,
    samples: { train: train.length, validation: validation.length, test: test.length },
    baselines: {
      accumulated: { validation: accumulatedValidation, test: accumulatedTest },
      historicalRemaining: { validation: historicalValidation, test: historicalTest },
    },
    candidates,
    selected: {
      model: winner.model,
      configuration: winner.configuration,
      validation: winner.validation,
      test: testMetrics,
      improvementVsAccumulatedPct: improvementAccumulated,
      improvementVsHistoricalRemainingPct: improvementHistorical,
      stableImprovement,
      artifact,
    },
    recommendation: improvesValidation
      ? {
          predictor: winner.model,
          reason: "candidate-beats-both-baselines",
          test: testMetrics,
        }
      : {
          predictor: bestBaseline.predictor,
          reason: "baseline-remains-best",
          test: bestBaseline.test,
        },
  };
};

export const evaluatePredictiveModels = (
  options: EvaluatePredictiveModelsOptions,
): PredictiveModelRun => {
  if (options.records.length === 0) throw new Error("El dataset predictivo no puede estar vacío");
  if (options.records.some((record) => record.datasetVersion !== options.datasetVersion)) {
    throw new Error("Todos los registros deben coincidir con datasetVersion");
  }
  const generatedAt = options.generatedAt ?? new Date();
  if (Number.isNaN(generatedAt.getTime())) throw new Error("generatedAt debe ser válido");
  const horizons = PREDICTIVE_DATASET_HORIZONS.map((horizon) =>
    evaluateHorizon(options.records, horizon),
  );
  const hashPayload = {
    modelVersion: PREDICTIVE_MODEL_VERSION,
    datasetVersion: options.datasetVersion,
    datasetHash: options.datasetHash,
    seed: PREDICTIVE_MODEL_SEED,
    horizons,
  };
  return {
    modelVersion: PREDICTIVE_MODEL_VERSION,
    generatedAt: generatedAt.toISOString(),
    datasetVersion: options.datasetVersion,
    datasetHash: options.datasetHash,
    dataOrigin: "simulated",
    seed: PREDICTIVE_MODEL_SEED,
    selectionMetric: "mae",
    secondaryMetrics: ["rmse", "wape"],
    evaluationProtocol: {
      selection: "train-to-validation",
      finalEvaluation: "train-plus-validation-to-test",
      predictionRounding: "nearest-non-negative-integer",
    },
    horizons,
    runHash: sha256(hashPayload),
    warnings: [
      "Resultados obtenidos con datos ficticios simulados; no representan precisión ni impacto empresarial.",
      "La selección usa validación cronológica y la prueba se reserva para la evaluación final.",
      "T-813 no publica predicciones por API ni automatiza decisiones.",
    ],
  };
};

