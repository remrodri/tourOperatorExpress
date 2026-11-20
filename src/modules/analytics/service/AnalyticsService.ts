import { StatusCodes } from "http-status-codes";
import { HttpException } from "../../../middleware/httpException";
import { AnalyticsDeparturesQueryDto } from "../dto/AnalyticsDeparturesQueryDto";
import { AnalyticsOverviewQueryDto } from "../dto/AnalyticsOverviewQueryDto";
import {
  AnalyticsDepartureRaw,
  AnalyticsSummaryRaw,
  IAnalyticsRepository,
} from "../repository/IAnalyticsRepository";
import {
  AnalyticsDeparture,
  AnalyticsDepartureDetailResponse,
  AnalyticsDepartureListResponse,
  AnalyticsFilters,
  AnalyticsFoundation,
  AnalyticsSummary,
  AnalyticsSummaryResponse,
  ANALYTICS_ALLOWED_ROLES,
  ANALYTICS_CONTRACT_VERSION,
  ANALYTICS_DESCRIPTIVE_CONTRACT_VERSION,
  ANALYTICS_DESCRIPTIVE_RELEASE,
  ANALYTICS_FICTITIOUS_DATA_WARNING,
  ANALYTICS_MODULE_NAME,
  ANALYTICS_RELEASE,
} from "../types/AnalyticsTypes";
import {
  decodeDepartureCursor,
  encodeDepartureCursor,
} from "../utils/departureCursor";
import { IAnalyticsService } from "./IAnalyticsService";

const notFound = (message: string) =>
  new HttpException(StatusCodes.NOT_FOUND, message);

const badRequest = (message: string) =>
  new HttpException(StatusCodes.BAD_REQUEST, message);

const safeNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const nonNegativeNumber = (value: unknown): number =>
  Math.max(0, safeNumber(value));

const nonNegativeInteger = (value: unknown): number =>
  Math.max(0, Math.trunc(safeNumber(value)));

const round2 = (value: number): number => {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const toIsoDate = (value: Date | null): string | null =>
  value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toISOString()
    : null;

const normalizeCapacity = (value: number | null): number | null =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  Number.isInteger(value) &&
  value > 0
    ? value
    : null;

const getCapacityStatus = (
  capacity: number | null,
  tourists: number,
): AnalyticsDeparture["capacityStatus"] => {
  if (capacity === null) {
    return "invalid";
  }

  if (tourists > capacity) {
    return "overcapacity";
  }

  return "valid";
};

const getPendingBalanceStatus = (
  bookings: number,
  reservedRevenue: number,
  registeredPayments: number,
): AnalyticsDeparture["pendingBalanceStatus"] => {
  if (bookings === 0) {
    return "no-bookings";
  }

  if (registeredPayments > reservedRevenue) {
    return "overpaid";
  }

  if (registeredPayments === reservedRevenue) {
    return "settled";
  }

  return "pending";
};

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
              "Este endpoint base no incluye indicadores; el resumen y el detalle están disponibles en los endpoints descriptivos T-809.",
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

  async getSummary(
    filters: AnalyticsOverviewQueryDto,
  ): Promise<AnalyticsSummaryResponse> {
    await this.validateFilterReferences(filters);

    const raw = await this.analyticsRepository.findSummary(filters);
    const summary = this.buildSummary(raw);

    return {
      data: { summary },
      meta: this.buildDescriptiveMeta(
        this.pickCommonFilters(filters),
        "Resumen descriptivo de salidas turísticas",
      ),
      warnings: this.buildSummaryWarnings(summary),
    };
  }

  async listDepartures(
    filters: AnalyticsDeparturesQueryDto,
  ): Promise<AnalyticsDepartureListResponse> {
    await this.validateFilterReferences(filters);

    const cursor = decodeDepartureCursor(filters.cursor);
    const rows = await this.analyticsRepository.findDepartures(filters, {
      limit: filters.limit,
      cursor,
    });
    const hasMore = rows.length > filters.limit;
    const pageRows = hasMore ? rows.slice(0, filters.limit) : rows;
    const items = pageRows.map((row) => this.toDeparture(row));
    const lastRow = pageRows[pageRows.length - 1];
    const nextCursor =
      hasMore && lastRow
        ? encodeDepartureCursor(lastRow.startDate, lastRow.id)
        : null;

    return {
      data: {
        items,
        pagination: {
          limit: filters.limit,
          hasMore,
          nextCursor,
        },
      },
      meta: this.buildDescriptiveMeta(
        this.pickCommonFilters(filters),
        "Listado descriptivo de salidas turísticas",
      ),
      warnings: this.buildDepartureListWarnings(items),
    };
  }

  async getDepartureDetail(
    id: string,
    filters: AnalyticsOverviewQueryDto,
  ): Promise<AnalyticsDepartureDetailResponse> {
    if (filters.dateRangeId && filters.dateRangeId !== id) {
      throw badRequest(
        "La salida de la ruta no coincide con el filtro dateRangeId",
      );
    }

    await this.validateFilterReferences(filters);

    const raw = await this.analyticsRepository.findDepartureById(id, filters);

    if (!raw) {
      throw notFound(
        "La salida turística indicada no existe o no coincide con los filtros",
      );
    }

    const departure = this.toDeparture(raw);
    const detailFilters = {
      ...this.pickCommonFilters(filters),
      dateRangeId: id,
    };

    return {
      data: { departure },
      meta: this.buildDescriptiveMeta(
        detailFilters,
        "Detalle descriptivo de una salida turística",
      ),
      warnings: this.buildDepartureWarnings(departure),
    };
  }

  private buildSummary(raw: AnalyticsSummaryRaw): AnalyticsSummary {
    const departures = nonNegativeInteger(raw.departures);
    const tourists = nonNegativeInteger(raw.tourists);
    const bookings = nonNegativeInteger(raw.bookings);
    const reservedRevenue = round2(nonNegativeNumber(raw.reservedRevenue));
    const registeredPayments = round2(
      nonNegativeNumber(raw.registeredPayments),
    );
    const invalidCapacityDepartures = nonNegativeInteger(
      raw.invalidCapacityDepartures,
    );
    const capacityStatus: AnalyticsSummary["capacityStatus"] =
      departures === 0
        ? "no-data"
        : invalidCapacityDepartures >= departures
          ? "invalid"
          : invalidCapacityDepartures > 0
            ? "partial"
            : "valid";
    const capacity =
      capacityStatus === "valid"
        ? nonNegativeNumber(raw.capacitySum)
        : null;
    const availableSlots =
      capacityStatus === "valid"
        ? nonNegativeNumber(raw.availableSlotsSum)
        : null;
    const occupancy =
      capacityStatus === "valid" && capacity !== null && capacity > 0
        ? round2((tourists / capacity) * 100)
        : null;

    return {
      departures,
      tourists,
      bookings,
      averageGroupSize:
        bookings > 0 ? round2(tourists / bookings) : null,
      averageGroupSizeStatus:
        bookings > 0 ? "available" : "no-bookings",
      reservedRevenue,
      registeredPayments,
      pendingBalance: round2(
        Math.max(reservedRevenue - registeredPayments, 0),
      ),
      pendingBalanceStatus: getPendingBalanceStatus(
        bookings,
        reservedRevenue,
        registeredPayments,
      ),
      capacity,
      availableSlots,
      occupancy,
      capacityStatus,
      invalidCapacityDepartures,
      overcapacityDepartures: nonNegativeInteger(
        raw.overcapacityDepartures,
      ),
      overpaidDepartures: nonNegativeInteger(raw.overpaidDepartures),
    };
  }

  private toDeparture(raw: AnalyticsDepartureRaw): AnalyticsDeparture {
    const tourists = nonNegativeInteger(raw.tourists);
    const bookings = nonNegativeInteger(raw.bookings);
    const reservedRevenue = round2(nonNegativeNumber(raw.reservedRevenue));
    const registeredPayments = round2(
      nonNegativeNumber(raw.registeredPayments),
    );
    const capacity = normalizeCapacity(raw.capacity);
    const capacityStatus = getCapacityStatus(capacity, tourists);
    const availableSlots =
      capacity === null ? null : Math.max(capacity - tourists, 0);
    const occupancy =
      capacity === null ? null : round2((tourists / capacity) * 100);

    return {
      id: raw.id,
      startDate: toIsoDate(raw.startDate),
      endDate: toIsoDate(raw.endDate),
      state: raw.state,
      dataOrigin: raw.dataOrigin,
      tourPackage: raw.tourPackage,
      destination: raw.destination,
      capacity,
      tourists,
      bookings,
      averageGroupSize:
        bookings > 0 ? round2(tourists / bookings) : null,
      averageGroupSizeStatus:
        bookings > 0 ? "available" : "no-bookings",
      reservedRevenue,
      registeredPayments,
      pendingBalance: round2(
        Math.max(reservedRevenue - registeredPayments, 0),
      ),
      pendingBalanceStatus: getPendingBalanceStatus(
        bookings,
        reservedRevenue,
        registeredPayments,
      ),
      availableSlots,
      occupancy,
      capacityStatus,
    };
  }

  private buildSummaryWarnings(summary: AnalyticsSummary): string[] {
    const warnings = [ANALYTICS_FICTITIOUS_DATA_WARNING];

    if (summary.departures === 0) {
      warnings.push(
        "NO_DATA: no hay salidas que coincidan con los filtros indicados.",
      );
    }

    if (summary.invalidCapacityDepartures > 0) {
      warnings.push(
        `INVALID_CAPACITY: ${summary.invalidCapacityDepartures} salida(s) no tienen capacidad positiva válida; la ocupación y los cupos agregados no se calculan.`,
      );
    }

    if (summary.overcapacityDepartures > 0) {
      warnings.push(
        `OVERCAPACITY: ${summary.overcapacityDepartures} salida(s) superan la capacidad registrada; la ocupación individual se conserva.`,
      );
    }

    if (summary.overpaidDepartures > 0) {
      warnings.push(
        `OVERPAID: ${summary.overpaidDepartures} salida(s) registran pagos superiores al ingreso reservado; el saldo pendiente se informa como cero.`,
      );
    }

    return warnings;
  }

  private buildDepartureListWarnings(
    items: AnalyticsDeparture[],
  ): string[] {
    const warnings = [ANALYTICS_FICTITIOUS_DATA_WARNING];

    if (items.length === 0) {
      warnings.push(
        "NO_DATA: no hay salidas en la página solicitada o que coincidan con los filtros indicados.",
      );
      return warnings;
    }

    const invalid = items.filter(
      (item) => item.capacityStatus === "invalid",
    ).length;
    const overcapacity = items.filter(
      (item) => item.capacityStatus === "overcapacity",
    ).length;
    const overpaid = items.filter(
      (item) => item.pendingBalanceStatus === "overpaid",
    ).length;

    if (invalid > 0) {
      warnings.push(
        `INVALID_CAPACITY: ${invalid} salida(s) de esta página no tienen capacidad positiva válida.`,
      );
    }

    if (overcapacity > 0) {
      warnings.push(
        `OVERCAPACITY: ${overcapacity} salida(s) de esta página superan la capacidad registrada.`,
      );
    }

    if (overpaid > 0) {
      warnings.push(
        `OVERPAID: ${overpaid} salida(s) de esta página registran pagos superiores al ingreso reservado.`,
      );
    }

    return warnings;
  }

  private buildDepartureWarnings(
    departure: AnalyticsDeparture,
  ): string[] {
    const warnings = [ANALYTICS_FICTITIOUS_DATA_WARNING];

    if (departure.capacityStatus === "invalid") {
      warnings.push(
        "INVALID_CAPACITY: la salida no tiene capacidad positiva válida; la ocupación y los cupos no se calculan.",
      );
    }

    if (departure.capacityStatus === "overcapacity") {
      warnings.push(
        "OVERCAPACITY: la salida supera la capacidad registrada; la ocupación se conserva y los cupos se informan como cero.",
      );
    }

    if (departure.pendingBalanceStatus === "overpaid") {
      warnings.push(
        "OVERPAID: los pagos registrados superan el ingreso reservado; el saldo pendiente se informa como cero.",
      );
    }

    return warnings;
  }

  private pickCommonFilters(filters: AnalyticsFilters): AnalyticsFilters {
    const common: AnalyticsFilters = {};

    if (filters.from) {
      common.from = filters.from;
    }

    if (filters.to) {
      common.to = filters.to;
    }

    if (filters.tourPackageId) {
      common.tourPackageId = filters.tourPackageId;
    }

    if (filters.destinationId) {
      common.destinationId = filters.destinationId;
    }

    if (filters.dateRangeId) {
      common.dateRangeId = filters.dateRangeId;
    }

    return common;
  }

  private buildDescriptiveMeta(
    filters: AnalyticsFilters,
    scope: string,
  ): AnalyticsDepartureDetailResponse["meta"] {
    return {
      module: ANALYTICS_MODULE_NAME,
      contractVersion: ANALYTICS_DESCRIPTIVE_CONTRACT_VERSION,
      release: ANALYTICS_DESCRIPTIVE_RELEASE,
      status: "descriptive",
      generatedAt: new Date().toISOString(),
      scope,
      period: {
        from: filters.from ?? null,
        to: filters.to ?? null,
      },
      filters,
      dataOrigin: "simulated",
    };
  }

  private async validateFilterReferences(
    filters: AnalyticsFilters,
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
