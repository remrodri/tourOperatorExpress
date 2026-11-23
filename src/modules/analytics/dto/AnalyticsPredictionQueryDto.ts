import { z } from "zod";

const horizon = z.preprocess(
  (value) => (typeof value === "string" ? Number(value) : value),
  z.union([z.literal(30), z.literal(14), z.literal(7)]),
);

export const AnalyticsPredictionQuerySchema = z
  .object({ horizonDays: horizon })
  .strict();

export const AnalyticsPredictionMetricsQuerySchema = z.object({}).strict();

export type AnalyticsPredictionQueryDto = z.infer<
  typeof AnalyticsPredictionQuerySchema
>;

