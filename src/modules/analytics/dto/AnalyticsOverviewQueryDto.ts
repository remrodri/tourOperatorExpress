import { z } from "zod";
import {
  analyticsCommonFilterShape,
  normalizeAnalyticsFilters,
  refineAnalyticsFilters,
} from "./analyticsFilterDto";

export const AnalyticsOverviewQuerySchema = z
  .object(analyticsCommonFilterShape)
  .strict()
  .superRefine(refineAnalyticsFilters)
  .transform(normalizeAnalyticsFilters);

export type AnalyticsOverviewQueryDto = z.infer<
  typeof AnalyticsOverviewQuerySchema
>;
