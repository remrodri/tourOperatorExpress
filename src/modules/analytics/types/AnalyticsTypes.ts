export const ANALYTICS_MODULE_NAME = "analytics";
export const ANALYTICS_CONTRACT_VERSION = "1.0.0";
export const ANALYTICS_RELEASE = "t808-v1";
export const ANALYTICS_DESCRIPTIVE_CONTRACT_VERSION = "1.1.0";
export const ANALYTICS_DESCRIPTIVE_RELEASE = "t809-v1";
export const ANALYTICS_TRENDS_CONTRACT_VERSION = "1.2.0";
export const ANALYTICS_TRENDS_RELEASE = "t810-v1";
export const ANALYTICS_TRENDS_AS_OF = "2026-11-13";
export const ANALYTICS_TRENDS_TIME_ZONE = "UTC";
export const ANALYTICS_TRENDS_MAX_POINTS = 400;
export const ANALYTICS_TRENDS_DEFAULT_WINDOW_DAYS = 30;
export const ANALYTICS_TRENDS_MAX_DEFAULT_WINDOW_DAYS = 365;
export const ANALYTICS_ECONOMIC_CONTRACT_VERSION = "1.5.0";
export const ANALYTICS_ECONOMIC_RELEASE = "t1206-v1";
export const ANALYTICS_ECONOMIC_AS_OF = "2026-11-13T23:59:59.999Z";

export const ANALYTICS_ALLOWED_ROLES = [
  "administrador",
  "operador de ventas",
] as const;

export const ANALYTICS_INCLUDED_BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "paid",
  "completed",
] as const;

export const ANALYTICS_EXCLUDED_BOOKING_STATUSES = ["cancelled"] as const;

export const ANALYTICS_FICTITIOUS_DATA_WARNING =
  "Datos ficticios: el conjunto incluye registros simulados y legados preservados; no representan observaciones reales de una empresa.";

export type AnalyticsAllowedRole = (typeof ANALYTICS_ALLOWED_ROLES)[number];

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  tourPackageId?: string;
  destinationId?: string;
  dateRangeId?: string;
}

export interface AnalyticsCapability {
  status: "planned";
  task: string;
  description: string;
}

export interface AnalyticsModuleMetadata {
  module: typeof ANALYTICS_MODULE_NAME;
  contractVersion: string;
  release: string;
  status: "foundation" | "descriptive";
  generatedAt: string;
  scope: string;
}

export interface AnalyticsAccessPolicy {
  roles: readonly AnalyticsAllowedRole[];
}

export interface AnalyticsPrivacyPolicy {
  dataOrigin: "simulated";
  aggregatesOnly: true;
  includesPii: false;
  calculationLayer: "backend";
}

export interface AnalyticsMeta extends AnalyticsModuleMetadata {
  period: {
    from: string | null;
    to: string | null;
  };
  filters: AnalyticsFilters;
}

export interface AnalyticsDescriptiveMeta extends AnalyticsMeta {
  dataOrigin: "simulated";
}

export interface AnalyticsFoundationData {
  filters: AnalyticsFilters;
  capabilities: {
    descriptive: AnalyticsCapability;
    predictive: AnalyticsCapability;
  };
  access: AnalyticsAccessPolicy;
  privacy: AnalyticsPrivacyPolicy;
}

export interface AnalyticsFoundation {
  data: AnalyticsFoundationData;
  meta: AnalyticsMeta;
  warnings: string[];
}

export type AnalyticsCapacityStatus = "valid" | "invalid" | "overcapacity";
export type AnalyticsSummaryCapacityStatus =
  | "valid"
  | "invalid"
  | "partial"
  | "no-data";
export type AnalyticsAverageGroupSizeStatus = "available" | "no-bookings";
export type AnalyticsPendingBalanceStatus =
  | "pending"
  | "settled"
  | "overpaid"
  | "no-bookings";

export interface AnalyticsDeparturePackage {
  id: string;
  name: string | null;
}

export interface AnalyticsDepartureDestination {
  id: string;
  name: string | null;
}

export interface AnalyticsDeparture {
  id: string;
  startDate: string | null;
  endDate: string | null;
  state: string | null;
  dataOrigin: string | null;
  tourPackage: AnalyticsDeparturePackage | null;
  destination: AnalyticsDepartureDestination | null;
  capacity: number | null;
  tourists: number;
  bookings: number;
  averageGroupSize: number | null;
  averageGroupSizeStatus: AnalyticsAverageGroupSizeStatus;
  reservedRevenue: number;
  registeredPayments: number;
  pendingBalance: number;
  pendingBalanceStatus: AnalyticsPendingBalanceStatus;
  availableSlots: number | null;
  occupancy: number | null;
  capacityStatus: AnalyticsCapacityStatus;
  attention: {
    priority: number;
    lifecycle: "prospective" | "historical" | "invalid-date";
    label: string;
    finalMinimum: number | null;
    missingTourists: number | null;
    urgency: import("../domain/economicRecommendation").EconomicUrgency;
    decisionDeadline: string | null;
  };
}

export interface AnalyticsSummary {
  departures: number;
  tourists: number;
  bookings: number;
  averageGroupSize: number | null;
  averageGroupSizeStatus: AnalyticsAverageGroupSizeStatus;
  reservedRevenue: number;
  registeredPayments: number;
  pendingBalance: number;
  pendingBalanceStatus: AnalyticsPendingBalanceStatus;
  capacity: number | null;
  availableSlots: number | null;
  occupancy: number | null;
  capacityStatus: AnalyticsSummaryCapacityStatus;
  invalidCapacityDepartures: number;
  overcapacityDepartures: number;
  overpaidDepartures: number;
}

export interface AnalyticsSummaryData {
  summary: AnalyticsSummary;
}

export interface AnalyticsDeparturePagination {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface AnalyticsDepartureListData {
  items: AnalyticsDeparture[];
  pagination: AnalyticsDeparturePagination;
}

export interface AnalyticsDepartureDetailData {
  departure: AnalyticsDeparture;
}

export interface AnalyticsSummaryResponse {
  data: AnalyticsSummaryData;
  meta: AnalyticsDescriptiveMeta;
  warnings: string[];
}

export interface AnalyticsDepartureListResponse {
  data: AnalyticsDepartureListData;
  meta: AnalyticsDescriptiveMeta;
  warnings: string[];
}

export interface AnalyticsDepartureDetailResponse {
  data: AnalyticsDepartureDetailData;
  meta: AnalyticsDescriptiveMeta;
  warnings: string[];
}

export interface AnalyticsEconomicResponse {
  data: import("../domain/economicViability").EconomicViabilityResult & {
    departureId: string;
    predictionState: import("../prediction/PredictiveAnalyticsTypes").AnalyticsPredictionState;
    predictionHorizonDays: 7 | 14 | 30;
    recommendation: import("../domain/economicRecommendation").EconomicRecommendation;
  };
  meta: {
    module: "analytics";
    contractVersion: typeof ANALYTICS_ECONOMIC_CONTRACT_VERSION;
    release: typeof ANALYTICS_ECONOMIC_RELEASE;
    status: "economic";
    generatedAt: string;
    dataOrigin: "simulated";
  };
  warnings: string[];
}

export type AnalyticsTrendGranularity = "day" | "week" | "month";
export type AnalyticsTrendState =
  | "available"
  | "insufficient-history"
  | "no-activity";
export type AnalyticsTrendWindowStatus = "open" | "closed" | "indeterminate";

export interface AnalyticsTrendPoint {
  intervalStart: string;
  intervalEnd: string;
  complete: boolean;
  observedDays: number;
  bookings: number;
  tourists: number;
  reservedRevenue: number;
  cumulativeBookings: number;
  cumulativeTourists: number;
  cumulativeReservedRevenue: number;
  touristsPerDay: number;
}

export interface AnalyticsTrendDeparture {
  id: string;
  startDate: string | null;
  endDate: string | null;
  state: string | null;
  dataOrigin: string | null;
  capacity: number | null;
  tourPackage: AnalyticsDeparturePackage | null;
  destination: AnalyticsDepartureDestination | null;
}

export interface AnalyticsTrendTotals {
  bookings: number;
  tourists: number;
  reservedRevenue: number;
  eventDays: number;
}

export interface AnalyticsTrendWindow {
  from: string;
  to: string;
  observedDays: number;
  status: AnalyticsTrendWindowStatus;
}

export interface AnalyticsTrendRhythm {
  window: AnalyticsTrendWindow;
  bookingsPerDay: number;
  touristsPerDay: number;
}

export interface AnalyticsTrendData {
  departure: AnalyticsTrendDeparture;
  state: AnalyticsTrendState;
  totals: AnalyticsTrendTotals;
  series: {
    granularity: AnalyticsTrendGranularity;
    timeZone: typeof ANALYTICS_TRENDS_TIME_ZONE;
    points: AnalyticsTrendPoint[];
  };
  rhythm: AnalyticsTrendRhythm;
}

export interface AnalyticsTrendObservation {
  eventField: "booking.createdAt";
  fromInclusive: true;
  toInclusive: true;
  granularity: AnalyticsTrendGranularity;
  timeZone: typeof ANALYTICS_TRENDS_TIME_ZONE;
  maxPoints: number;
  defaultWindowDays: number;
  maxDefaultWindowDays: number;
  asOfRule: "booking.createdAt <= asOf";
  cumulativeScope: "observation-window";
}

export interface AnalyticsTrendsMeta extends AnalyticsDescriptiveMeta {
  granularity: AnalyticsTrendGranularity;
  timeZone: typeof ANALYTICS_TRENDS_TIME_ZONE;
  asOf: string;
  observation: AnalyticsTrendObservation;
}

export interface AnalyticsTrendsResponse {
  data: AnalyticsTrendData;
  meta: AnalyticsTrendsMeta;
  warnings: string[];
}
