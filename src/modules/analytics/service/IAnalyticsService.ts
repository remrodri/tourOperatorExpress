import { AnalyticsOverviewQueryDto } from "../dto/AnalyticsOverviewQueryDto";
import { AnalyticsFoundation } from "../types/AnalyticsTypes";

export interface IAnalyticsService {
  getOverview(filters: AnalyticsOverviewQueryDto): Promise<AnalyticsFoundation>;
}
