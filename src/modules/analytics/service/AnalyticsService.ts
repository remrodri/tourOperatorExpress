import { StatusCodes } from "http-status-codes";
import { HttpException } from "../../../middleware/httpException";
import { AnalyticsOverviewQueryDto } from "../dto/AnalyticsOverviewQueryDto";
import { IAnalyticsRepository } from "../repository/IAnalyticsRepository";
import {
  ANALYTICS_ALLOWED_ROLES,
  ANALYTICS_CONTRACT_VERSION,
  ANALYTICS_MODULE_NAME,
  ANALYTICS_RELEASE,
  AnalyticsFoundation,
} from "../types/AnalyticsTypes";
import { IAnalyticsService } from "./IAnalyticsService";

const notFound = (message: string) =>
  new HttpException(StatusCodes.NOT_FOUND, message);

const badRequest = (message: string) =>
  new HttpException(StatusCodes.BAD_REQUEST, message);

export class AnalyticsService implements IAnalyticsService {
  private readonly analyticsRepository: IAnalyticsRepository;

  constructor(analyticsRepository: IAnalyticsRepository) {
    this.analyticsRepository = analyticsRepository;
  }

  async getOverview(
    filters: AnalyticsOverviewQueryDto,
  ): Promise<AnalyticsFoundation> {
    await this.validateFilterReferences(filters);

    return {
      data: {
        filters,
        capabilities: {
          descriptive: {
            status: "planned",
            task: "T-809",
            description:
              "Resumen y detalle por salida se incorporarán en la siguiente tarea.",
          },
          predictive: {
            status: "planned",
            task: "T-812",
            description:
              "La estimación de turistas por salida se incorporará en tareas posteriores.",
          },
        },
        access: {
          roles: ANALYTICS_ALLOWED_ROLES,
        },
        privacy: {
          dataOrigin: "simulated",
          aggregatesOnly: true,
          includesPii: false,
          calculationLayer: "backend",
        },
      },
      meta: {
        module: ANALYTICS_MODULE_NAME,
        contractVersion: ANALYTICS_CONTRACT_VERSION,
        release: ANALYTICS_RELEASE,
        status: "foundation",
        generatedAt: new Date().toISOString(),
        scope: "Base de contratos para analítica descriptiva y predictiva",
        period: {
          from: filters.from ?? null,
          to: filters.to ?? null,
        },
        filters,
      },
      warnings: [
        "Módulo base T-808: no incluye indicadores ni predicciones.",
        "Los análisis posteriores se calcularán en el backend sobre datos simulados identificados como tales.",
      ],
    };
  }

  private async validateFilterReferences(
    filters: AnalyticsOverviewQueryDto,
  ): Promise<void> {
    const tourPackage = filters.tourPackageId
      ? await this.analyticsRepository.findTourPackage(filters.tourPackageId)
      : null;

    if (filters.tourPackageId && !tourPackage) {
      throw notFound("El paquete turístico indicado no existe");
    }

    if (
      filters.destinationId &&
      !(await this.analyticsRepository.destinationExists(
        filters.destinationId,
      ))
    ) {
      throw notFound("El destino turístico indicado no existe");
    }

    if (
      tourPackage &&
      filters.destinationId &&
      tourPackage.destinationId !== filters.destinationId
    ) {
      throw badRequest("El paquete turístico no pertenece al destino indicado");
    }

    const departure = filters.dateRangeId
      ? await this.analyticsRepository.findDeparture(filters.dateRangeId)
      : null;

    if (filters.dateRangeId && !departure) {
      throw notFound("La salida turística indicada no existe");
    }

    if (
      departure?.tourPackageId &&
      filters.tourPackageId &&
      departure.tourPackageId !== filters.tourPackageId
    ) {
      throw badRequest("La salida turística no pertenece al paquete indicado");
    }
  }
}
