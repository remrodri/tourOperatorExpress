import { StatusCodes } from "http-status-codes";
import { HttpException } from "../../../middleware/httpException";
import { AnalyticsDeparturesQueryDto } from "../dto/AnalyticsDeparturesQueryDto";
import { AnalyticsOverviewQueryDto } from "../dto/AnalyticsOverviewQueryDto";
import { AnalyticsTrendsQueryDto } from "../dto/AnalyticsTrendsQueryDto";
import {
  AnalyticsDepartureRaw,
  AnalyticsSummaryRaw,
  AnalyticsTrendDataRaw,
  AnalyticsTrendDepartureRaw,
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
  AnalyticsTrendData,
  AnalyticsTrendDeparture,
  AnalyticsTrendGranularity,
  AnalyticsTrendPoint,
  AnalyticsTrendsMeta,
  AnalyticsTrendsResponse,
  ANALYTICS_ALLOWED_ROLES,
  ANALYTICS_CONTRACT_VERSION,
  ANALYTICS_DESCRIPTIVE_CONTRACT_VERSION,
  ANALYTICS_DESCRIPTIVE_RELEASE,
  ANALYTICS_FICTITIOUS_DATA_WARNING,
  ANALYTICS_MODULE_NAME,
  ANALYTICS_RELEASE,
  ANALYTICS_TRENDS_AS_OF,
  ANALYTICS_TRENDS_CONTRACT_VERSION,
  ANALYTICS_TRENDS_DEFAULT_WINDOW_DAYS,
  ANALYTICS_TRENDS_MAX_DEFAULT_WINDOW_DAYS,
  ANALYTICS_TRENDS_MAX_POINTS,
  ANALYTICS_TRENDS_RELEASE,
  ANALYTICS_TRENDS_TIME_ZONE,
  ANALYTICS_ECONOMIC_CONTRACT_VERSION,
  ANALYTICS_ECONOMIC_RELEASE,
  AnalyticsEconomicResponse,
  ANALYTICS_ECONOMIC_AS_OF,
} from "../types/AnalyticsTypes";
import { calculateEconomicViability } from "../domain/economicViability";
import { buildEconomicRecommendation } from "../domain/economicRecommendation";
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

const DAY_MS = 86_400_000;
const TRENDS_AS_OF_INSTANT = new Date(
  `${ANALYTICS_TRENDS_AS_OF}T23:59:59.999Z`,
);
const TRENDS_AS_OF_DAY = new Date(`${ANALYTICS_TRENDS_AS_OF}T00:00:00.000Z`);

interface TrendBucket {
  bucketStart: Date;
  intervalStart: Date;
  intervalEnd: Date;
  complete: boolean;
  observedDays: number;
}

interface TrendWindow {
  from: Date;
  to: Date;
  defaultTruncated: boolean;
}

interface TrendEventTotals {
  bookings: number;
  tourists: number;
  reservedRevenue: number;
}

const toUtcDay = (value: Date | string): Date => {
  const date = value instanceof Date ? value : new Date(value);

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
};

const addUtcDays = (value: Date, days: number): Date =>
  new Date(value.getTime() + days * DAY_MS);

const differenceInDays = (end: Date, start: Date): number =>
  Math.round((end.getTime() - start.getTime()) / DAY_MS);

const toUtcDayIso = (value: Date): string => value.toISOString();

const floorTrendBucket = (
  value: Date,
  granularity: AnalyticsTrendGranularity,
): Date => {
  if (granularity === "week") {
    const day = value.getUTCDay();
    return addUtcDays(value, -((day + 6) % 7));
  }

  if (granularity === "month") {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
  }

  return toUtcDay(value);
};

const nextTrendBucket = (
  value: Date,
  granularity: AnalyticsTrendGranularity,
): Date => {
  if (granularity === "week") {
    return addUtcDays(value, 7);
  }

  if (granularity === "month") {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 1),
    );
  }

  return addUtcDays(value, 1);
};

const countTrendBuckets = (
  from: Date,
  to: Date,
  granularity: AnalyticsTrendGranularity,
): number => {
  let cursor = floorTrendBucket(from, granularity);
  let count = 0;

  while (cursor.getTime() <= to.getTime()) {
    count += 1;

    if (count > ANALYTICS_TRENDS_MAX_POINTS) {
      return count;
    }

    cursor = nextTrendBucket(cursor, granularity);
  }

  return count;
};

const buildTrendBuckets = (
  from: Date,
  to: Date,
  granularity: AnalyticsTrendGranularity,
): TrendBucket[] => {
  const buckets: TrendBucket[] = [];
  const toExclusive = addUtcDays(to, 1);
  let bucketStart = floorTrendBucket(from, granularity);

  while (bucketStart.getTime() <= to.getTime()) {
    const next = nextTrendBucket(bucketStart, granularity);
    const intervalStart =
      bucketStart.getTime() < from.getTime() ? from : bucketStart;
    const intervalEnd =
      next.getTime() > toExclusive.getTime() ? toExclusive : next;

    buckets.push({
      bucketStart,
      intervalStart,
      intervalEnd,
      complete:
        bucketStart.getTime() >= from.getTime() &&
        next.getTime() <= toExclusive.getTime(),
      observedDays: Math.max(
        differenceInDays(intervalEnd, intervalStart),
        0,
      ),
    });

    bucketStart = next;
  }

  return buckets;
};

const parseTrendEventDay = (value: string): Date | null => {
  const day = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(day.getTime()) ? null : day;
};

const buildTrendSeries = (
  events: AnalyticsTrendDataRaw["events"],
  from: Date,
  to: Date,
  granularity: AnalyticsTrendGranularity,
): {
  points: AnalyticsTrendPoint[];
  totals: TrendEventTotals;
  eventDays: number;
} => {
  const buckets = buildTrendBuckets(from, to, granularity);
  const eventsByBucket = new Map<number, TrendEventTotals>();
  const eventDays = new Set<string>();
  const totals: TrendEventTotals = {
    bookings: 0,
    tourists: 0,
    reservedRevenue: 0,
  };

  for (const event of events) {
    const eventDay = parseTrendEventDay(event.date);

    if (
      !eventDay ||
      eventDay.getTime() < from.getTime() ||
      eventDay.getTime() > to.getTime()
    ) {
      continue;
    }

    const bucketKey = floorTrendBucket(eventDay, granularity).getTime();
    const current = eventsByBucket.get(bucketKey) ?? {
      bookings: 0,
      tourists: 0,
      reservedRevenue: 0,
    };
    const bookings = nonNegativeInteger(event.bookings);
    const tourists = nonNegativeInteger(event.tourists);
    const reservedRevenue = nonNegativeNumber(event.reservedRevenue);

    current.bookings += bookings;
    current.tourists += tourists;
    current.reservedRevenue += reservedRevenue;
    eventsByBucket.set(bucketKey, current);
    totals.bookings += bookings;
    totals.tourists += tourists;
    totals.reservedRevenue += reservedRevenue;
    eventDays.add(event.date);
  }

  let cumulativeBookings = 0;
  let cumulativeTourists = 0;
  let cumulativeReservedRevenue = 0;
  const points = buckets.map((bucket) => {
    const event = eventsByBucket.get(bucket.bucketStart.getTime()) ?? {
      bookings: 0,
      tourists: 0,
      reservedRevenue: 0,
    };

    cumulativeBookings += event.bookings;
    cumulativeTourists += event.tourists;
    cumulativeReservedRevenue += event.reservedRevenue;

    return {
      intervalStart: toUtcDayIso(bucket.intervalStart),
      intervalEnd: toUtcDayIso(bucket.intervalEnd),
      complete: bucket.complete,
      observedDays: bucket.observedDays,
      bookings: event.bookings,
      tourists: event.tourists,
      reservedRevenue: round2(event.reservedRevenue),
      cumulativeBookings,
      cumulativeTourists,
      cumulativeReservedRevenue: round2(cumulativeReservedRevenue),
      touristsPerDay:
        bucket.observedDays > 0
          ? round2(event.tourists / bucket.observedDays)
          : 0,
    };
  });

  return {
    points,
    totals: {
      bookings: totals.bookings,
      tourists: totals.tourists,
      reservedRevenue: round2(totals.reservedRevenue),
    },
    eventDays: eventDays.size,
  };
};

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
    const rows = filters.order === "attention"
      ? await this.analyticsRepository.findDeparturesForAttention(filters)
      : await this.analyticsRepository.findDepartures(filters, {
        limit: filters.limit,
        cursor,
      });
    const orderedItems = rows.map((row) => this.toDeparture(row));
    if (filters.order === "attention") {
      orderedItems.sort((left, right) => this.compareDepartureAttention(left, right));
    }
    const cursorIndex = filters.order === "attention" && cursor
      ? orderedItems.findIndex((item) => item.id === cursor.id.toString())
      : -1;
    if (filters.order === "attention" && cursor && cursorIndex < 0) {
      throw badRequest("Cursor de paginación inválido para el orden solicitado");
    }
    const candidateItems = filters.order === "attention"
      ? orderedItems.slice(cursorIndex + 1, cursorIndex + 1 + filters.limit + 1)
      : orderedItems;
    const hasMore = candidateItems.length > filters.limit;
    const items = hasMore ? candidateItems.slice(0, filters.limit) : candidateItems;
    const lastRow = items[items.length - 1];
    const nextCursor =
      hasMore && lastRow
        ? encodeDepartureCursor(lastRow.startDate ? new Date(lastRow.startDate) : null, lastRow.id)
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

  async getDepartureEconomics(
    id: string,
    horizonDays: 7 | 14 | 30,
    predictionState: import("../prediction/PredictiveAnalyticsTypes").AnalyticsPredictionState,
    predictedFinalTourists: number | null,
  ): Promise<AnalyticsEconomicResponse> {
    const raw = await this.analyticsRepository.findDepartureById(id, {});
    if (!raw) throw notFound("Salida turística no encontrada");
    const predictionAvailable = predictionState === "available";
    const result = calculateEconomicViability(
      raw.economicPlan,
      normalizeCapacity(raw.capacity),
      nonNegativeInteger(raw.tourists),
      predictionAvailable ? predictedFinalTourists : null,
    );
    const recommendation = buildEconomicRecommendation(
      raw.economicPlan,
      result,
      new Date(ANALYTICS_ECONOMIC_AS_OF),
    );
    const warnings = [ANALYTICS_FICTITIOUS_DATA_WARNING];
    if (!predictionAvailable) {
      warnings.push(`PREDICTION_NOT_USED: la estimación está en estado ${predictionState}; el análisis estimado no se publica.`);
    }
    if (result.status === "economic-data-missing") warnings.push("ECONOMIC_DATA_MISSING: la salida no tiene plan económico.");
    if (result.status === "non-positive-contribution") warnings.push("NON_POSITIVE_CONTRIBUTION: el precio no supera el costo variable por turista.");
    if (result.status === "capacity-insufficient") warnings.push("CAPACITY_INSUFFICIENT: el mínimo final supera la capacidad registrada.");
    return {
      data: {
        departureId: id,
        predictionState,
        predictionHorizonDays: horizonDays,
        ...result,
        recommendation,
      },
      meta: {
        module: "analytics",
        contractVersion: ANALYTICS_ECONOMIC_CONTRACT_VERSION,
        release: ANALYTICS_ECONOMIC_RELEASE,
        status: "economic",
        generatedAt: new Date().toISOString(),
        dataOrigin: "simulated",
      },
      warnings,
    };
  }

  async getDepartureTrends(
    filters: AnalyticsTrendsQueryDto,
  ): Promise<AnalyticsTrendsResponse> {
    await this.validateFilterReferences(filters);

    const raw = await this.analyticsRepository.findTrendData(
      filters.dateRangeId,
      filters,
    );

    if (!raw) {
      throw notFound(
        "La salida turística indicada no existe o no coincide con los filtros",
      );
    }

    const window = this.resolveTrendWindow(raw, filters);
    const pointCount = countTrendBuckets(
      window.from,
      window.to,
      filters.granularity,
    );

    if (pointCount > ANALYTICS_TRENDS_MAX_POINTS) {
      throw badRequest(
        `La ventana no puede superar ${ANALYTICS_TRENDS_MAX_POINTS} puntos para la granularidad ${filters.granularity}`,
      );
    }

    const series = buildTrendSeries(
      raw.events,
      window.from,
      window.to,
      filters.granularity,
    );
    const state =
      series.totals.bookings === 0
        ? "no-activity"
        : series.eventDays < 2
          ? "insufficient-history"
          : "available";
    const observedDays = Math.max(
      differenceInDays(addUtcDays(window.to, 1), window.from),
      0,
    );
    const departure = this.toTrendDeparture(raw.departure);
    const startDay = departure.startDate
      ? toUtcDay(departure.startDate)
      : null;
    const windowStatus = startDay
      ? window.to.getTime() >= startDay.getTime()
        ? "closed"
        : "open"
      : "indeterminate";
    const data: AnalyticsTrendData = {
      departure,
      state,
      totals: {
        bookings: series.totals.bookings,
        tourists: series.totals.tourists,
        reservedRevenue: series.totals.reservedRevenue,
        eventDays: series.eventDays,
      },
      series: {
        granularity: filters.granularity,
        timeZone: ANALYTICS_TRENDS_TIME_ZONE,
        points: series.points,
      },
      rhythm: {
        window: {
          from: toUtcDayIso(window.from),
          to: toUtcDayIso(window.to),
          observedDays,
          status: windowStatus,
        },
        bookingsPerDay:
          observedDays > 0
            ? round2(series.totals.bookings / observedDays)
            : 0,
        touristsPerDay:
          observedDays > 0
            ? round2(series.totals.tourists / observedDays)
            : 0,
      },
    };
    const meta = this.buildTrendsMeta(filters, window);

    return {
      data,
      meta,
      warnings: this.buildTrendWarnings(
        data,
        raw.invalidDateBookings,
        raw.afterAsOfBookings,
        window.defaultTruncated,
      ),
    };
  }

  private resolveTrendWindow(
    raw: AnalyticsTrendDataRaw,
    filters: AnalyticsTrendsQueryDto,
  ): TrendWindow {
    const departureStartDay = raw.departure.startDate
      ? toUtcDay(raw.departure.startDate)
      : null;
    const defaultTo =
      departureStartDay &&
      departureStartDay.getTime() < TRENDS_AS_OF_DAY.getTime()
        ? departureStartDay
        : TRENDS_AS_OF_DAY;
    const to = filters.to ? toUtcDay(filters.to) : defaultTo;

    if (filters.from) {
      return {
        from: toUtcDay(filters.from),
        to,
        defaultTruncated: false,
      };
    }

    const firstEvent = raw.events
      .map((event) => parseTrendEventDay(event.date))
      .find(
        (eventDay): eventDay is Date =>
          eventDay !== null && eventDay.getTime() <= to.getTime(),
      );
    const minimumFrom = addUtcDays(
      to,
      -(ANALYTICS_TRENDS_MAX_DEFAULT_WINDOW_DAYS - 1),
    );
    const candidateFrom = firstEvent
      ? firstEvent
      : addUtcDays(to, -(ANALYTICS_TRENDS_DEFAULT_WINDOW_DAYS - 1));
    const from =
      candidateFrom.getTime() < minimumFrom.getTime()
        ? minimumFrom
        : candidateFrom;

    return {
      from,
      to,
      defaultTruncated:
        candidateFrom.getTime() < minimumFrom.getTime(),
    };
  }

  private toTrendDeparture(
    raw: AnalyticsTrendDepartureRaw,
  ): AnalyticsTrendDeparture {
    return {
      id: raw.id,
      startDate: toIsoDate(raw.startDate),
      endDate: toIsoDate(raw.endDate),
      state: raw.state,
      dataOrigin: raw.dataOrigin,
      capacity: normalizeCapacity(raw.capacity),
      tourPackage: raw.tourPackage,
      destination: raw.destination,
    };
  }

  private buildTrendsMeta(
    filters: AnalyticsTrendsQueryDto,
    window: TrendWindow,
  ): AnalyticsTrendsMeta {
    const from = toUtcDayIso(window.from);
    const to = toUtcDayIso(window.to);
    const commonFilters: AnalyticsFilters = {
      ...this.pickCommonFilters(filters),
      from,
      to,
      dateRangeId: filters.dateRangeId,
    };

    return {
      module: ANALYTICS_MODULE_NAME,
      contractVersion: ANALYTICS_TRENDS_CONTRACT_VERSION,
      release: ANALYTICS_TRENDS_RELEASE,
      status: "descriptive",
      generatedAt: new Date().toISOString(),
      scope:
        "Tendencias y ritmo de reservas de una salida turística en ventana acotada",
      period: { from, to },
      filters: commonFilters,
      dataOrigin: "simulated",
      granularity: filters.granularity,
      timeZone: ANALYTICS_TRENDS_TIME_ZONE,
      asOf: TRENDS_AS_OF_INSTANT.toISOString(),
      observation: {
        eventField: "booking.createdAt",
        fromInclusive: true,
        toInclusive: true,
        granularity: filters.granularity,
        timeZone: ANALYTICS_TRENDS_TIME_ZONE,
        maxPoints: ANALYTICS_TRENDS_MAX_POINTS,
        defaultWindowDays: ANALYTICS_TRENDS_DEFAULT_WINDOW_DAYS,
        maxDefaultWindowDays:
          ANALYTICS_TRENDS_MAX_DEFAULT_WINDOW_DAYS,
        asOfRule: "booking.createdAt <= asOf",
        cumulativeScope: "observation-window",
      },
    };
  }

  private buildTrendWarnings(
    data: AnalyticsTrendData,
    invalidDateBookings: number,
    afterAsOfBookings: number,
    defaultTruncated: boolean,
  ): string[] {
    const warnings = [ANALYTICS_FICTITIOUS_DATA_WARNING];

    if (data.state === "no-activity") {
      warnings.push(
        "NO_ACTIVITY: no hay reservas incluidas en la ventana de observación.",
      );
    }

    if (data.state === "insufficient-history") {
      warnings.push(
        "INSUFFICIENT_HISTORY: solo hay actividad en un día de la ventana; la serie no permite describir una tendencia estable.",
      );
    }

    if (data.rhythm.window.status === "open") {
      warnings.push(
        "PARTIAL_WINDOW: la ventana termina antes del inicio de la salida; el ritmo corresponde a una observación parcial.",
      );
    }

    if (data.series.points.some((point) => !point.complete)) {
      warnings.push(
        "PARTIAL_BUCKET: el primer o el último intervalo no cubre un período calendario completo.",
      );
    }

    if (invalidDateBookings > 0) {
      warnings.push(
        `INVALID_BOOKING_DATE: ${invalidDateBookings} reserva(s) incluidas no tienen una fecha de creación válida y quedaron fuera de la serie.`,
      );
    }

    if (afterAsOfBookings > 0) {
      warnings.push(
        `EVENTS_AFTER_AS_OF: ${afterAsOfBookings} reserva(s) fueron creadas después de asOf y quedaron fuera de la serie.`,
      );
    }

    if (defaultTruncated) {
      warnings.push(
        `DEFAULT_WINDOW_TRUNCATED: la ventana por defecto se limitó a ${ANALYTICS_TRENDS_MAX_DEFAULT_WINDOW_DAYS} días.`,
      );
    }

    return warnings;
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

    const viability = calculateEconomicViability(
      raw.economicPlan,
      capacity,
      tourists,
      null,
    );
    const recommendation = buildEconomicRecommendation(
      raw.economicPlan,
      viability,
      new Date(ANALYTICS_ECONOMIC_AS_OF),
    );
    const startDate = toIsoDate(raw.startDate);
    const lifecycle = startDate === null
      ? "invalid-date" as const
      : new Date(startDate).getTime() <= new Date(ANALYTICS_ECONOMIC_AS_OF).getTime()
        ? "historical" as const
        : "prospective" as const;
    const attention = this.buildDepartureAttention(
      lifecycle,
      capacity,
      capacityStatus,
      tourists,
      viability,
      recommendation,
    );

    return {
      id: raw.id,
      startDate,
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
      attention,
    };
  }

  private buildDepartureAttention(
    lifecycle: "prospective" | "historical" | "invalid-date",
    capacity: number | null,
    capacityStatus: AnalyticsDeparture["capacityStatus"],
    tourists: number,
    viability: ReturnType<typeof calculateEconomicViability>,
    recommendation: ReturnType<typeof buildEconomicRecommendation>,
  ): AnalyticsDeparture["attention"] {
    const base = {
      lifecycle,
      finalMinimum: viability.finalMinimum,
      missingTourists: viability.missingConfirmedTourists,
      urgency: recommendation.urgency,
      decisionDeadline: recommendation.decisionDeadline,
    };
    if (lifecycle === "historical") return { ...base, priority: 7, label: "Salida histórica" };
    if (lifecycle === "invalid-date") return { ...base, priority: 0, label: "Información temporal incompleta" };
    if (capacityStatus === "invalid") return { ...base, priority: 0, label: "Falta registrar la capacidad" };
    if (viability.status === "economic-data-missing") return { ...base, priority: 0, label: "Información económica incompleta" };
    if (viability.status === "non-positive-contribution") return { ...base, priority: 0, label: "Margen no viable" };
    if (viability.status === "capacity-insufficient") return { ...base, priority: 0, label: "Capacidad insuficiente para el mínimo" };
    if (recommendation.urgency === "decision-required") return { ...base, priority: 1, label: "Decisión requerida" };
    if (recommendation.urgency === "priority-action") return { ...base, priority: 2, label: "Revisión prioritaria" };
    if (recommendation.urgency === "commercial-action") return { ...base, priority: 3, label: "Acción comercial recomendada" };
    if (recommendation.urgency === "monitor") return { ...base, priority: 4, label: viability.missingConfirmedTourists ? (viability.missingConfirmedTourists === 1 ? "Falta 1 turista" : `Faltan ${viability.missingConfirmedTourists} turistas`) : "Seguimiento recomendado" };
    if (capacity !== null && tourists >= capacity) return { ...base, priority: 6, label: "Capacidad completa" };
    if (viability.finalMinimum !== null && tourists >= viability.finalMinimum) return { ...base, priority: 5, label: "Mínimo alcanzado" };
    if (viability.missingConfirmedTourists !== null && viability.missingConfirmedTourists > 0) return { ...base, priority: 4, label: viability.missingConfirmedTourists === 1 ? "Falta 1 turista" : `Faltan ${viability.missingConfirmedTourists} turistas` };
    if (tourists === 0) return { ...base, priority: 4, label: "Sin reservas confirmadas" };
    return { ...base, priority: 5, label: "Mínimo alcanzado" };
  }

  private compareDepartureAttention(
    left: AnalyticsDeparture,
    right: AnalyticsDeparture,
  ): number {
    if (left.attention.priority !== right.attention.priority) {
      return left.attention.priority - right.attention.priority;
    }
    const leftStart = left.startDate ? new Date(left.startDate).getTime() : Number.POSITIVE_INFINITY;
    const rightStart = right.startDate ? new Date(right.startDate).getTime() : Number.POSITIVE_INFINITY;
    if (left.attention.priority === 7 && leftStart !== rightStart) return rightStart - leftStart;
    const leftDeadline = left.attention.decisionDeadline
      ? new Date(left.attention.decisionDeadline).getTime()
      : Number.POSITIVE_INFINITY;
    const rightDeadline = right.attention.decisionDeadline
      ? new Date(right.attention.decisionDeadline).getTime()
      : Number.POSITIVE_INFINITY;
    if (leftDeadline !== rightDeadline) return leftDeadline - rightDeadline;
    if (leftStart !== rightStart) return leftStart - rightStart;
    return left.id.localeCompare(right.id);
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
