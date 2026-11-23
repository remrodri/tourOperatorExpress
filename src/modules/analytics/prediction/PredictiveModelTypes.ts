import {
  PredictiveDatasetRecord,
  PredictiveHorizon,
} from "../dataset/PredictiveDatasetTypes";

export const PREDICTIVE_MODEL_VERSION = "t813-v1";
export const PREDICTIVE_MODEL_SEED = 20261123;

export type PredictiveModelName =
  | "baseline-accumulated"
  | "baseline-historical-remaining"
  | "ridge"
  | "regression-tree";

export interface PredictiveMetrics {
  count: number;
  mae: number;
  rmse: number;
  wape: number | null;
  actualTotal: number;
  predictedTotal: number;
}

export interface PredictiveEvaluationRow {
  key: string;
  departureId: string;
  horizonDays: PredictiveHorizon;
  actual: number;
  predicted: number;
}

export interface RidgeModelArtifact {
  kind: "ridge";
  lambda: number;
  featureNames: string[];
  means: number[];
  scales: number[];
  coefficients: number[];
}

export interface RegressionTreeNode {
  prediction: number;
  count: number;
  featureIndex?: number;
  threshold?: number;
  left?: RegressionTreeNode;
  right?: RegressionTreeNode;
}

export interface RegressionTreeArtifact {
  kind: "regression-tree";
  maxDepth: number;
  minLeaf: number;
  featureNames: string[];
  root: RegressionTreeNode;
}

export type CandidateModelArtifact =
  | RidgeModelArtifact
  | RegressionTreeArtifact;

export interface CandidateEvaluation {
  model: "ridge" | "regression-tree";
  configuration: Record<string, number>;
  validation: PredictiveMetrics;
}

export interface HorizonEvaluation {
  horizonDays: PredictiveHorizon;
  samples: {
    train: number;
    validation: number;
    test: number;
  };
  baselines: {
    accumulated: {
      validation: PredictiveMetrics;
      test: PredictiveMetrics;
    };
    historicalRemaining: {
      validation: PredictiveMetrics;
      test: PredictiveMetrics;
    };
  };
  candidates: CandidateEvaluation[];
  selected: {
    model: "ridge" | "regression-tree";
    configuration: Record<string, number>;
    validation: PredictiveMetrics;
    test: PredictiveMetrics;
    improvementVsAccumulatedPct: number;
    improvementVsHistoricalRemainingPct: number;
    stableImprovement: boolean;
    artifact: CandidateModelArtifact;
  };
  recommendation: {
    predictor: PredictiveModelName;
    reason: "candidate-beats-both-baselines" | "baseline-remains-best";
    test: PredictiveMetrics;
  };
}

export interface PredictiveModelRun {
  modelVersion: typeof PREDICTIVE_MODEL_VERSION;
  generatedAt: string;
  datasetVersion: string;
  datasetHash: string;
  dataOrigin: "simulated";
  seed: typeof PREDICTIVE_MODEL_SEED;
  selectionMetric: "mae";
  secondaryMetrics: ["rmse", "wape"];
  evaluationProtocol: {
    selection: "train-to-validation";
    finalEvaluation: "train-plus-validation-to-test";
    predictionRounding: "nearest-non-negative-integer";
  };
  horizons: HorizonEvaluation[];
  runHash: string;
  warnings: string[];
}

export interface EvaluatePredictiveModelsOptions {
  records: PredictiveDatasetRecord[];
  datasetVersion: string;
  datasetHash: string;
  generatedAt?: Date;
}

