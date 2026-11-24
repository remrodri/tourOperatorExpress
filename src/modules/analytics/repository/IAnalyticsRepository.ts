import { AnalyticsFilters } from "../types/AnalyticsTypes";
import { DepartureCursorValue } from "../utils/departureCursor";
import type { EconomicPlan } from "../../dateRange/domain/economicPlanning";

export interface AnalyticsPackageReference {
  destinationId: string;
}

export interface AnalyticsDepartureReference {
  tourPackageId: string | null;
}

export interface AnalyticsDepartureRaw {
  id: string;
  startDate: Date | null;
  endDate: Date | null;
  state: string | null;
  dataOrigin: string | null;
  capacity: number | null;
  tourists: number;
  bookings: number;
  reservedRevenue: number;
  registeredPayments: number;
  economicPlan: EconomicPlan | null;
  tourPackage: { id: string; name: string | null } | null;
  destination: { id: string; name: string | null } | null;
}

export interface AnalyticsSummaryRaw {
  departures: number;
  tourists: number;
  bookings: number;
  reservedRevenue: number;
  registeredPayments: number;
  capacitySum: number;
  availableSlotsSum: number;
  validCapacityDepartures: number;
  invalidCapacityDepartures: number;
  overcapacityDepartures: number;
  overpaidDepartures: number;
}

export interface AnalyticsDepartureQueryOptions {
  limit: number;
  cursor: DepartureCursorValue | null;
}

export interface AnalyticsTrendDepartureRaw {
  id: string;
  startDate: Date | null;
  endDate: Date | null;
  state: string | null;
  dataOrigin: string | null;
  capacity: number | null;
  tourPackage: { id: string; name: string | null } | null;
  destination: { id: string; name: string | null } | null;
}

export interface AnalyticsTrendEventRaw {
  date: string;
  bookings: number;
  tourists: number;
  reservedRevenue: number;
}

export interface AnalyticsTrendDataRaw {
  departure: AnalyticsTrendDepartureRaw;
  events: AnalyticsTrendEventRaw[];
  invalidDateBookings: number;
  afterAsOfBookings: number;
}

export interface IAnalyticsRepository {
  findTourPackage(id: string): Promise<AnalyticsPackageReference | null>;
  destinationExists(id: string): Promise<boolean>;
  findDeparture(id: string): Promise<AnalyticsDepartureReference | null>;
  findSummary(filters: AnalyticsFilters): Promise<AnalyticsSummaryRaw>;
  findDepartures(
    filters: AnalyticsFilters,
    options: AnalyticsDepartureQueryOptions,
  ): Promise<AnalyticsDepartureRaw[]>;
  findDepartureById(
    id: string,
    filters: AnalyticsFilters,
  ): Promise<AnalyticsDepartureRaw | null>;
  findTrendData(
    id: string,
    filters: AnalyticsFilters,
  ): Promise<AnalyticsTrendDataRaw | null>;
}
