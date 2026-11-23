import { StatusCodes } from "http-status-codes";
import { HttpException } from "../../../middleware/httpException";
import { buildPredictiveDataset } from "../dataset/PredictiveDatasetBuilder";
import { loadPredictiveDatasetInputs } from "../dataset/PredictiveDatasetRepository";
import {
  PREDICTIVE_DATASET_AS_OF,
  PredictiveDatasetInputs,
  PredictiveDatasetRecord,
  PredictiveHorizon,
} from "../dataset/PredictiveDatasetTypes";
import { AnalyticsPredictionQueryDto } from "../dto/AnalyticsPredictionQueryDto";
import modelArtifactJson from "./artifacts/t813-model.json";
import {
  predictAccumulatedBaseline,
  predictHistoricalRemainingBaseline,
  predictWithArtifact,
} from "./PredictiveModelEvaluator";
import { PredictiveModelRun } from "./PredictiveModelTypes";
import {
  ANALYTICS_MODEL_STALE_AFTER_DAYS,
  ANALYTICS_PREDICTIVE_AS_OF,
  ANALYTICS_PREDICTIVE_CONTRACT_VERSION,
  ANALYTICS_PREDICTIVE_RELEASE,
  AnalyticsPredictionData,
  AnalyticsPredictionMetricsResponse,
  AnalyticsPredictionResponse,
  AnalyticsPredictiveMeta,
} from "./PredictiveAnalyticsTypes";

const DAY_MS = 86_400_000;
const INFERENCE_OUTCOME_AS_OF = new Date("2100-01-01T00:00:00.000Z");
const EXPECTED_MODEL_VERSION = "t813-v1";
const EXPECTED_DATASET_VERSION = "t812-v1";
const EXPECTED_DATASET_HASH =
  "8786e43a8fe23c2e6145ad2d6a7710076e6e4fb9917a9498d93efdc77835ae22";
const EXPECTED_RUN_HASH =
  "84328dfb399b39e8f9a1abef5c97aafa625fca4af977d838c19a675d6280aa5d";
type InputLoader = () => Promise<PredictiveDatasetInputs>;
type Clock = () => Date;

const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const addDays = (value: Date, days: number): Date =>
  new Date(value.getTime() + days * DAY_MS);

const isValidDate = (value: Date | null): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const isValidCapacity = (value: number | null): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

export class PredictiveAnalyticsService {
  private readonly artifact: PredictiveModelRun;
  private readonly inputLoader: InputLoader;
  private readonly clock: Clock;

  constructor(
    artifact: PredictiveModelRun = modelArtifactJson as unknown as PredictiveModelRun,
    inputLoader: InputLoader = loadPredictiveDatasetInputs,
    clock: Clock = () => new Date(),
  ) {
    this.validateArtifact(artifact);
    this.artifact = artifact;
    this.inputLoader = inputLoader;
    this.clock = clock;
  }

  async getPrediction(
    departureId: string,
    query: AnalyticsPredictionQueryDto,
  ): Promise<AnalyticsPredictionResponse> {
    const inputs = await this.inputLoader();
    const departure = inputs.departures.find((item) => item.id === departureId);
    if (!departure) {
      throw new HttpException(StatusCodes.NOT_FOUND, "Salida turística no encontrada");
    }

    const cutoffAt = isValidDate(departure.startDate)
      ? addDays(departure.startDate, -query.horizonDays)
      : null;
    const base = this.emptyPrediction(
      departureId,
      query.horizonDays,
      cutoffAt,
      departure.capacity,
      departure.dataOrigin,
    );

    if (!isValidCapacity(departure.capacity)) {
      return this.response(
        { ...base, state: "invalid-capacity" },
        ["INVALID_CAPACITY: la salida no tiene capacidad positiva; no se calcula ocupación esperada."],
      );
    }

    if (
      departure.dataOrigin !== "simulated" ||
      !isValidDate(departure.startDate) ||
      !isValidDate(departure.endDate) ||
      !departure.tourPackageId ||
      !inputs.packages.some((item) => item.id === departure.tourPackageId)
    ) {
      return this.response(
        { ...base, state: "no-data" },
        ["NO_DATA: la salida no cumple los datos mínimos y el origen simulado exigidos por el predictor."],
      );
    }

    if (!cutoffAt || cutoffAt.getTime() > new Date(PREDICTIVE_DATASET_AS_OF).getTime()) {
      return this.response(
        { ...base, state: "insufficient-history" },
        ["INSUFFICIENT_HISTORY: el corte solicitado todavía no está disponible al asOf del modelo."],
      );
    }

    const horizon = this.artifact.horizons.find(
      (item) => item.horizonDays === query.horizonDays,
    );
    if (!horizon) {
      return this.response(
        { ...base, state: "insufficient-history" },
        ["INSUFFICIENT_HISTORY: el artefacto no contiene evaluación para el horizonte solicitado."],
      );
    }

    if (this.isStale()) {
      return this.response(
        { ...base, state: "stale-model", predictor: horizon.recommendation.predictor },
        ["STALE_MODEL: el artefacto superó su vigencia; no se publica una estimación como actual."],
      );
    }

    const inferenceDataset = buildPredictiveDataset({
      ...inputs,
      asOf: INFERENCE_OUTCOME_AS_OF,
      generatedAt: new Date(this.artifact.generatedAt),
    });
    const record = inferenceDataset.records.find(
      (item) =>
        item.departureId === departureId &&
        item.horizonDays === query.horizonDays,
    );
    if (!record) {
      return this.response(
        { ...base, state: "no-data" },
        ["NO_DATA: no fue posible construir predictores reproducibles para la salida y corte solicitados."],
      );
    }

    const predicted = this.predict(record, horizon.recommendation.predictor, horizon.selected.artifact);
    const mae = horizon.recommendation.test.mae;
    const lower = Math.max(0, Math.round(predicted - mae));
    const upper = Math.max(lower, Math.round(predicted + mae));

    return this.response(
      {
        ...base,
        state: "available",
        confirmedTourists: record.features.confirmedTourists,
        predictedFinalTourists: predicted,
        predictionRange: { lower, upper, method: "test-mae-band" },
        capacity: departure.capacity,
        expectedOccupancy: round2((predicted / departure.capacity) * 100),
        predictor: horizon.recommendation.predictor,
        metrics: horizon.recommendation.test,
      },
      [
        "Datos ficticios: la estimación es demostrativa y no representa precisión empresarial.",
        "La banda usa ±MAE histórico de prueba; no es un intervalo probabilístico.",
        ...(predicted > departure.capacity
          ? ["EXPECTED_OVERCAPACITY: la estimación supera la capacidad y no fue truncada."]
          : []),
      ],
    );
  }

  async getMetrics(): Promise<AnalyticsPredictionMetricsResponse> {
    const state = this.isStale() ? "stale-model" : "available";
    return {
      data: {
        state,
        modelVersion: this.artifact.modelVersion,
        datasetVersion: this.artifact.datasetVersion,
        datasetHash: this.artifact.datasetHash,
        runHash: this.artifact.runHash,
        selectionMetric: this.artifact.selectionMetric,
        secondaryMetrics: this.artifact.secondaryMetrics,
        horizons: this.artifact.horizons.map((item) => ({
          horizonDays: item.horizonDays,
          recommendedPredictor: item.recommendation.predictor,
          recommendationReason: item.recommendation.reason,
          validation:
            item.recommendation.predictor === "baseline-accumulated"
              ? item.baselines.accumulated.validation
              : item.recommendation.predictor === "baseline-historical-remaining"
                ? item.baselines.historicalRemaining.validation
                : item.selected.validation,
          test: item.recommendation.test,
          candidate: {
            model: item.selected.model,
            configuration: item.selected.configuration,
            validation: item.selected.validation,
            test: item.selected.test,
            stableImprovement: item.selected.stableImprovement,
          },
          baselines: item.baselines,
        })),
      },
      meta: this.meta(),
      warnings: [
        "Resultados calculados con datos ficticios simulados; no constituyen validación empresarial.",
        ...(state === "stale-model"
          ? ["STALE_MODEL: el artefacto superó su vigencia configurada."]
          : []),
      ],
    };
  }

  private predict(
    record: PredictiveDatasetRecord,
    predictor: PredictiveModelRun["horizons"][number]["recommendation"]["predictor"],
    artifact: PredictiveModelRun["horizons"][number]["selected"]["artifact"],
  ): number {
    if (predictor === "baseline-accumulated") return predictAccumulatedBaseline(record);
    if (predictor === "baseline-historical-remaining") {
      return predictHistoricalRemainingBaseline(record);
    }
    return predictWithArtifact(artifact, record);
  }

  private emptyPrediction(
    departureId: string,
    horizonDays: PredictiveHorizon,
    cutoffAt: Date | null,
    capacity: number | null,
    departureDataOrigin: string | null,
  ): AnalyticsPredictionData {
    return {
      state: "no-data",
      departureId,
      cutoffDate: cutoffAt?.toISOString().slice(0, 10) ?? null,
      cutoffAt: cutoffAt?.toISOString() ?? null,
      horizonDays,
      confirmedTourists: null,
      predictedFinalTourists: null,
      predictionRange: null,
      capacity: isValidCapacity(capacity) ? capacity : null,
      expectedOccupancy: null,
      predictor: null,
      modelVersion: this.artifact.modelVersion,
      datasetVersion: this.artifact.datasetVersion,
      datasetHash: this.artifact.datasetHash,
      runHash: this.artifact.runHash,
      metrics: null,
      dataOrigin: "simulated",
      departureDataOrigin,
    };
  }

  private validateArtifact(artifact: PredictiveModelRun): void {
    const horizons = artifact.horizons
      ?.map((item) => item.horizonDays)
      .sort((left, right) => left - right);
    const validHorizons =
      JSON.stringify(horizons) === JSON.stringify([7, 14, 30]);
    const structurallyComplete = artifact.horizons?.every(
      (item) =>
        item.recommendation?.predictor &&
        item.recommendation?.test &&
        item.selected?.artifact &&
        item.baselines?.accumulated &&
        item.baselines?.historicalRemaining,
    );

    if (
      artifact.modelVersion !== EXPECTED_MODEL_VERSION ||
      artifact.datasetVersion !== EXPECTED_DATASET_VERSION ||
      artifact.datasetHash !== EXPECTED_DATASET_HASH ||
      artifact.runHash !== EXPECTED_RUN_HASH ||
      !validHorizons ||
      !structurallyComplete
    ) {
      throw new Error("Artefacto predictivo T-813 inválido o incompatible");
    }
  }

  private response(
    data: AnalyticsPredictionData,
    warnings: string[],
  ): AnalyticsPredictionResponse {
    return { data, meta: this.meta(), warnings };
  }

  private meta(): AnalyticsPredictiveMeta {
    return {
      module: "analytics",
      contractVersion: ANALYTICS_PREDICTIVE_CONTRACT_VERSION,
      release: ANALYTICS_PREDICTIVE_RELEASE,
      status: "predictive",
      dataOrigin: "simulated",
      generatedAt: this.clock().toISOString(),
      asOf: ANALYTICS_PREDICTIVE_AS_OF,
      modelGeneratedAt: this.artifact.generatedAt,
      staleAfterDays: ANALYTICS_MODEL_STALE_AFTER_DAYS,
    };
  }

  private isStale(): boolean {
    const age = this.clock().getTime() - new Date(this.artifact.generatedAt).getTime();
    return age > ANALYTICS_MODEL_STALE_AFTER_DAYS * DAY_MS;
  }
}

