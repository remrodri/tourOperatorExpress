import {
  calculatePredictiveMetrics,
  evaluatePredictiveModels,
} from "../../src/modules/analytics/prediction/PredictiveModelEvaluator";
import {
  PREDICTIVE_DATASET_VERSION,
  PredictiveDatasetRecord,
  PredictiveHorizon,
  PredictiveSplit,
} from "../../src/modules/analytics/dataset/PredictiveDatasetTypes";

const splitFor = (index: number): PredictiveSplit =>
  index < 30 ? "train" : index < 42 ? "validation" : "test";

const makeRecord = (
  index: number,
  horizonDays: PredictiveHorizon,
  testLabelOffset = 0,
): PredictiveDatasetRecord => {
  const split = splitFor(index);
  const confirmedTourists = (index % 8) + (horizonDays === 7 ? 4 : horizonDays === 14 ? 2 : 0);
  const labelFinalTourists = confirmedTourists + 2 + (index % 3) + (split === "test" ? testLabelOffset : 0);
  return {
    datasetVersion: PREDICTIVE_DATASET_VERSION,
    key: `departure-${index}:${horizonDays}`,
    departureId: `departure-${index}`,
    cutoffDate: "2026-01-01",
    cutoffAt: "2026-01-01T00:00:00.000Z",
    horizonDays,
    split,
    dataOrigin: "simulated",
    labelFinalTourists,
    recordHash: `hash-${index}-${horizonDays}`,
    features: {
      confirmedTourists,
      confirmedBookings: Math.ceil(confirmedTourists / 2),
      averageGroupSize: confirmedTourists === 0 ? null : 2,
      rhythm: {
        last7Days: {
          windowDays: 7,
          bookings: index % 3,
          tourists: index % 5,
          bookingsPerDay: (index % 3) / 7,
          touristsPerDay: (index % 5) / 7,
        },
        last14Days: {
          windowDays: 14,
          bookings: index % 5,
          tourists: index % 7,
          bookingsPerDay: (index % 5) / 14,
          touristsPerDay: (index % 7) / 14,
        },
      },
      salesAgeDays: index + 1,
      daysUntilDeparture: horizonDays,
      departureMonth: (index % 12) + 1,
      departureIsoWeek: (index % 52) + 1,
      departureDayOfWeek: index % 7,
      season: index % 3 === 0 ? "high" : index % 3 === 1 ? "mid" : "low",
      tourPackageId: `package-${index % 4}`,
      destinationId: `destination-${index % 3}`,
      tourTypeId: `type-${index % 2}`,
      durationDays: (index % 5) + 1,
      packagePrice: 100 + index * 5,
      capacity: 20,
      historicalPackage: {
        completedDepartures: 10 + index,
        averageFinalOccupancy: 0.5,
      },
    },
  };
};

const makeRecords = (testLabelOffset = 0): PredictiveDatasetRecord[] =>
  ([30, 14, 7] as const).flatMap((horizon) =>
    Array.from({ length: 54 }, (_, index) => makeRecord(index, horizon, testLabelOffset)),
  );

describe("Predictive model evaluation T-813", () => {
  it("calculates MAE, RMSE and WAPE", () => {
    const metrics = calculatePredictiveMetrics([
      { key: "a", departureId: "a", horizonDays: 7, actual: 2, predicted: 1 },
      { key: "b", departureId: "b", horizonDays: 7, actual: 4, predicted: 6 },
    ]);
    expect(metrics).toEqual({
      count: 2,
      mae: 1.5,
      rmse: 1.581139,
      wape: 0.5,
      actualTotal: 6,
      predictedTotal: 7,
    });
  });

  it("returns null WAPE when actual demand is zero", () => {
    const metrics = calculatePredictiveMetrics([
      { key: "a", departureId: "a", horizonDays: 7, actual: 0, predicted: 1 },
    ]);
    expect(metrics.wape).toBeNull();
  });

  it("evaluates both baselines and candidates independently by horizon", () => {
    const result = evaluatePredictiveModels({
      records: makeRecords(),
      datasetVersion: PREDICTIVE_DATASET_VERSION,
      datasetHash: "dataset-hash",
      generatedAt: new Date("2026-11-23T00:00:00.000Z"),
    });
    expect(result.modelVersion).toBe("t813-v1");
    expect(result.horizons.map((item) => item.horizonDays)).toEqual([30, 14, 7]);
    for (const horizon of result.horizons) {
      expect(horizon.samples).toEqual({ train: 30, validation: 12, test: 12 });
      expect(horizon.candidates).toHaveLength(6);
      expect(horizon.baselines.accumulated.test.count).toBe(12);
      expect(horizon.baselines.historicalRemaining.test.count).toBe(12);
      expect(horizon.selected.test.count).toBe(12);
      expect(horizon.selected.test.predictedTotal).toBeGreaterThanOrEqual(0);
      expect(horizon.recommendation.test.count).toBe(12);
    }
  });

  it("is deterministic apart from generatedAt", () => {
    const options = {
      records: makeRecords(),
      datasetVersion: PREDICTIVE_DATASET_VERSION,
      datasetHash: "dataset-hash",
    };
    const first = evaluatePredictiveModels({ ...options, generatedAt: new Date("2026-11-23T00:00:00Z") });
    const second = evaluatePredictiveModels({ ...options, generatedAt: new Date("2026-11-24T00:00:00Z") });
    expect(first.runHash).toBe(second.runHash);
    expect(first.horizons).toEqual(second.horizons);
  });

  it("does not use test labels to select model or hyperparameters", () => {
    const normal = evaluatePredictiveModels({
      records: makeRecords(), datasetVersion: PREDICTIVE_DATASET_VERSION, datasetHash: "a",
    });
    const changedTest = evaluatePredictiveModels({
      records: makeRecords(100), datasetVersion: PREDICTIVE_DATASET_VERSION, datasetHash: "b",
    });
    expect(changedTest.horizons.map((item) => ({
      model: item.selected.model,
      configuration: item.selected.configuration,
      validation: item.selected.validation,
      recommendation: {
        predictor: item.recommendation.predictor,
        reason: item.recommendation.reason,
      },
    }))).toEqual(normal.horizons.map((item) => ({
      model: item.selected.model,
      configuration: item.selected.configuration,
      validation: item.selected.validation,
      recommendation: {
        predictor: item.recommendation.predictor,
        reason: item.recommendation.reason,
      },
    })));
    expect(changedTest.horizons.map((item) => item.selected.test.mae))
      .not.toEqual(normal.horizons.map((item) => item.selected.test.mae));
  });

  it("keeps the accumulated baseline when no candidate beats it in validation", () => {
    const baselinePerfect = makeRecords().map((record) => ({
      ...record,
      labelFinalTourists: record.features.confirmedTourists,
    }));
    const result = evaluatePredictiveModels({
      records: baselinePerfect, datasetVersion: PREDICTIVE_DATASET_VERSION, datasetHash: "baseline",
    });
    expect(result.horizons.every(
      (item) => item.recommendation.predictor === "baseline-accumulated",
    )).toBe(true);
  });

  it("rejects an empty dataset", () => {
    expect(() => evaluatePredictiveModels({
      records: [], datasetVersion: PREDICTIVE_DATASET_VERSION, datasetHash: "empty",
    })).toThrow("no puede estar vacío");
  });

  it("rejects records from another dataset version", () => {
    const records = makeRecords();
    records[0] = { ...records[0], datasetVersion: "other" };
    expect(() => evaluatePredictiveModels({
      records, datasetVersion: PREDICTIVE_DATASET_VERSION, datasetHash: "mismatch",
    })).toThrow("datasetVersion");
  });

  it("requires non-empty chronological partitions for every horizon", () => {
    const records = makeRecords().filter(
      (record) => !(record.horizonDays === 30 && record.split === "test"),
    );
    expect(() => evaluatePredictiveModels({
      records, datasetVersion: PREDICTIVE_DATASET_VERSION, datasetHash: "missing-test",
    })).toThrow("requiere train, validation y test");
  });
});

