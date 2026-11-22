import { AnalyticsDeparturesQueryDto } from "../dto/AnalyticsDeparturesQueryDto";
import { AnalyticsOverviewQueryDto } from "../dto/AnalyticsOverviewQueryDto";
import { AnalyticsTrendsQueryDto } from "../dto/AnalyticsTrendsQueryDto";
import {
  AnalyticsDepartureDetailResponse,
  AnalyticsDepartureListResponse,
  AnalyticsFoundation,
  AnalyticsSummaryResponse,
  AnalyticsTrendsResponse,
} from "../types/AnalyticsTypes";

export interface IAnalyticsService {
  getOverview(filters: AnalyticsOverviewQueryDto): Promise<AnalyticsFoundation>;
  getSummary(
    filters: AnalyticsOverviewQueryDto,
  ): Promise<AnalyticsSummaryResponse>;
  listDepartures(
    filters: AnalyticsDeparturesQueryDto,
  ): Promise<AnalyticsDepartureListResponse>;
  getDepartureDetail(
    id: string,
    filters: AnalyticsOverviewQueryDto,
  ): Promise<AnalyticsDepartureDetailResponse>;
  getDepartureTrends(
    filters: AnalyticsTrendsQueryDto,
  ): Promise<AnalyticsTrendsResponse>;
}
