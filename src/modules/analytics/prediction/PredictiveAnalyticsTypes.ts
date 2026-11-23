import { PredictiveHorizon } from "../dataset/PredictiveDatasetTypes";
import {
  PredictiveMetrics,
  PredictiveModelName,
} from "./PredictiveModelTypes";

export const ANALYTICS_PREDICTIVE_CONTRACT_VERSION = "1.3.0";
export const ANALYTICS_PREDICTIVE_RELEASE = "t814-v1";
export const ANALYTICS_PREDICTIVE_AS_OF = "2026-11-13T23:59:59.999Z";
export const ANALYTICS_MODEL_STALE_AFTER_DAYS = 90;

export type AnalyticsPredictionState =
  | "available"
  | "no-data"
  | "insufficient-history"
  | "invalid-capacity"
  | "stale-model";

export interface AnalyticsPredictionData {
  state: AnalyticsPredictionState;
  departureId: string;
  cutoffDate: string | null;
  cutoffAt: string | null;
  horizonDays: PredictiveHorizon;
  confirmedTourists: number | null;
  predictedFinalTourists: number | null;
  predictionRange: {
    lower: number;
    upper: number;
    method: "test-mae-band";
  } | null;
  capacity: number | null;
  expectedOccupancy: number | null;
  predictor: PredictiveModelName | null;
  modelVersion: string;
  datasetVersion: string;
  datasetHash: string;
  runHash: string;
  metrics: PredictiveMetrics | null;
  dataOrigin: "simulated";
  departureDataOrigin: string | null;
}

export interface AnalyticsPredictiveMeta {
  module: "analytics";
  contractVersion: typeof ANALYTICS_PREDICTIVE_CONTRACT_VERSION;
  release: typeof ANALYTICS_PREDICTIVE_RELEASE;
  status: "predictive";
  dataOrigin: "simulated";
  generatedAt: string;
  asOf: typeof ANALYTICS_PREDICTIVE_AS_OF;
  modelGeneratedAt: string;
  staleAfterDays: typeof ANALYTICS_MODEL_STALE_AFTER_DAYS;
}

export interface AnalyticsPredictionResponse {
  data: AnalyticsPredictionData;
  meta: AnalyticsPredictiveMeta;
  warnings: string[];
}

export interface AnalyticsPredictionMetricItem {
  horizonDays: PredictiveHorizon;
  recommendedPredictor: PredictiveModelName;
  recommendationReason: string;
  validation: PredictiveMetrics;
  test: PredictiveMetrics;
  candidate: {
    model: "ridge" | "regression-tree";
    configuration: Record<string, number>;
    validation: PredictiveMetrics;
    test: PredictiveMetrics;
    stableImprovement: boolean;
  };
  baselines: {
    accumulated: { validation: PredictiveMetrics; test: PredictiveMetrics };
    historicalRemaining: { validation: PredictiveMetrics; test: PredictiveMetrics };
  };
}

export interface AnalyticsPredictionMetricsResponse {
  data: {
    state: "available" | "stale-model";
    modelVersion: string;
    datasetVersion: string;
    datasetHash: string;
    runHash: string;
    selectionMetric: "mae";
    secondaryMetrics: ["rmse", "wape"];
    horizons: AnalyticsPredictionMetricItem[];
  };
  meta: AnalyticsPredictiveMeta;
  warnings: string[];
}

