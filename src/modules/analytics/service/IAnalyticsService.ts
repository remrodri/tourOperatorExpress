import { AnalyticsDeparturesQueryDto } from "../dto/AnalyticsDeparturesQueryDto";
import { AnalyticsOverviewQueryDto } from "../dto/AnalyticsOverviewQueryDto";
import { AnalyticsTrendsQueryDto } from "../dto/AnalyticsTrendsQueryDto";
import {
  AnalyticsDepartureDetailResponse,
  AnalyticsDepartureListResponse,
  AnalyticsFoundation,
  AnalyticsSummaryResponse,
  AnalyticsTrendsResponse,
  AnalyticsEconomicResponse,
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
  getDepartureEconomics(
    id: string,
    horizonDays: 7 | 14 | 30,
    predictionState: import("../prediction/PredictiveAnalyticsTypes").AnalyticsPredictionState,
    predictedFinalTourists: number | null,
  ): Promise<AnalyticsEconomicResponse>;
}
