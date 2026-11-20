import { z } from "zod";
import {
  analyticsCommonFilterShape,
  normalizeAnalyticsFilters,
  refineAnalyticsFilters,
} from "./analyticsFilterDto";

const optionalCursor = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const AnalyticsDeparturesQuerySchema = z
  .object({
    ...analyticsCommonFilterShape,
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: optionalCursor,
  })
  .strict()
  .superRefine(refineAnalyticsFilters)
  .transform(normalizeAnalyticsFilters);

export type AnalyticsDeparturesQueryDto = z.infer<
  typeof AnalyticsDeparturesQuerySchema
>;
