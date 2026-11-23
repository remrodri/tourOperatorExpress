export const PREDICTIVE_DATASET_VERSION = "t812-v1";
export const PREDICTIVE_DATASET_AS_OF = "2026-11-13T23:59:59.999Z";
export const PREDICTIVE_DATASET_TIME_ZONE = "UTC";
export const PREDICTIVE_DATASET_HORIZONS = [30, 14, 7] as const;

export type PredictiveHorizon = (typeof PREDICTIVE_DATASET_HORIZONS)[number];

export const PREDICTIVE_INCLUDED_BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "paid",
  "completed",
] as const;

export const PREDICTIVE_EXCLUDED_BOOKING_STATUSES = ["cancelled"] as const;

export const PREDICTIVE_SPLIT_RATIOS = {
  train: 0.7,
  validation: 0.15,
  test: 0.15,
} as const;

export type PredictiveSplit = keyof typeof PREDICTIVE_SPLIT_RATIOS;

export const PREDICTIVE_DISCARD_REASONS = [
  "non-simulated-origin",
  "missing-dates",
  "invalid-capacity",
  "missing-package",
  "outcome-unavailable",
  "invalid-cutoff",
] as const;

export type PredictiveDiscardReason =
  (typeof PREDICTIVE_DISCARD_REASONS)[number];

export type PredictiveSeason = "low" | "mid" | "high";

export interface PredictiveDatasetDeparture {
  id: string;
  startDate: Date | null;
  endDate: Date | null;
  capacity: number | null;
  tourPackageId: string | null;
  dataOrigin: string | null;
  simulationId?: string | null;
  simulationVersion?: string | null;
  simulationSeed?: number | null;
}

export interface PredictiveDatasetBooking {
  departureId: string;
  status: string;
  tourists: number;
  createdAt: Date | null;
}

export interface PredictiveDatasetPackage {
  id: string;
  destinationId: string | null;
  tourTypeId: string | null;
  durationDays: number | null;
  price: number | null;
}

export interface PredictiveDatasetInputs {
  departures: PredictiveDatasetDeparture[];
  bookings: PredictiveDatasetBooking[];
  packages: PredictiveDatasetPackage[];
}

export interface BuildPredictiveDatasetOptions extends PredictiveDatasetInputs {
  asOf?: Date;
  generatedAt?: Date;
}

export interface PredictiveRhythmWindow {
  windowDays: number;
  bookings: number;
  tourists: number;
  bookingsPerDay: number;
  touristsPerDay: number;
}

export interface PredictiveHistoricalPackage {
  completedDepartures: number;
  averageFinalOccupancy: number | null;
}

export interface PredictiveFeatures {
  confirmedTourists: number;
  confirmedBookings: number;
  averageGroupSize: number | null;
  rhythm: {
    last7Days: PredictiveRhythmWindow;
    last14Days: PredictiveRhythmWindow;
  };
  salesAgeDays: number | null;
  daysUntilDeparture: number;
  departureMonth: number;
  departureIsoWeek: number;
  departureDayOfWeek: number;
  season: PredictiveSeason;
  tourPackageId: string;
  destinationId: string | null;
  tourTypeId: string | null;
  durationDays: number | null;
  packagePrice: number | null;
  capacity: number;
  historicalPackage: PredictiveHistoricalPackage;
}

export interface PredictiveDatasetRecord {
  datasetVersion: string;
  key: string;
  departureId: string;
  cutoffDate: string;
  cutoffAt: string;
  horizonDays: PredictiveHorizon;
  split: PredictiveSplit;
  dataOrigin: "simulated";
  labelFinalTourists: number;
  features: PredictiveFeatures;
  recordHash: string;
}

export interface PredictiveHorizonSummary {
  candidates: number;
  included: number;
  discarded: Record<PredictiveDiscardReason, number>;
  labelTourists: number;
  rowsWithoutPriorBookings: number;
}

export interface PredictiveSplitSummary {
  departures: number;
  rows: number;
  firstDepartureStart: string | null;
  lastDepartureStart: string | null;
  labelTourists: number;
}

export interface PredictiveDatasetSummary {
  departures: {
    candidates: number;
    included: number;
    discarded: Record<PredictiveDiscardReason, number>;
  };
  horizons: Record<`${PredictiveHorizon}`, PredictiveHorizonSummary>;
  splits: Record<PredictiveSplit, PredictiveSplitSummary>;
  rows: number;
}

export interface PredictiveDatasetSource {
  simulationVersions: string[];
  simulationSeeds: number[];
  simulationIds: string[];
}

export interface PredictiveDataset {
  datasetVersion: string;
  generatedAt: string;
  asOf: string;
  timeZone: typeof PREDICTIVE_DATASET_TIME_ZONE;
  dataOrigin: "simulated";
  horizons: PredictiveHorizon[];
  splitRatios: typeof PREDICTIVE_SPLIT_RATIOS;
  source: PredictiveDatasetSource;
  summary: PredictiveDatasetSummary;
  records: PredictiveDatasetRecord[];
  datasetHash: string;
  warnings: string[];
}
