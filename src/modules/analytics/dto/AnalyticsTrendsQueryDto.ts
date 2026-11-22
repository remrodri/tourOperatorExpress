import { Types } from "mongoose";
import { z } from "zod";
import {
  ANALYTICS_TRENDS_AS_OF,
  ANALYTICS_TRENDS_MAX_POINTS,
} from "../types/AnalyticsTypes";
import {
  analyticsCommonFilterShape,
  normalizeAnalyticsFilters,
  refineAnalyticsFilters,
} from "./analyticsFilterDto";

const requiredObjectId = z
  .string()
  .trim()
  .refine((value) => Types.ObjectId.isValid(value), {
    message: "Identificador inválido",
  });

const asOfInstant = Date.parse(
  `${ANALYTICS_TRENDS_AS_OF}T23:59:59.999Z`,
);

export const AnalyticsTrendsQuerySchema = z
  .object({
    ...analyticsCommonFilterShape,
    dateRangeId: requiredObjectId,
    granularity: z.enum(["day", "week", "month"]).default("day"),
  })
  .strict()
  .superRefine((value, context) => {
    refineAnalyticsFilters(value, context);

    if (value.to && new Date(value.to).getTime() > asOfInstant) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: `to no puede superar asOf (${ANALYTICS_TRENDS_AS_OF})`,
      });
    }

    if (
      value.from &&
      value.to &&
      new Date(value.from).getTime() <= new Date(value.to).getTime()
    ) {
      const from = new Date(value.from).getTime();
      const to = new Date(value.to).getTime();
      const days = Math.floor((to - from) / 86_400_000) + 1;

      if (
        value.granularity === "day" &&
        days > ANALYTICS_TRENDS_MAX_POINTS
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["to"],
          message: `La ventana no puede superar ${ANALYTICS_TRENDS_MAX_POINTS} puntos diarios`,
        });
      }
    }
  })
  .transform(normalizeAnalyticsFilters);

export type AnalyticsTrendsQueryDto = z.infer<
  typeof AnalyticsTrendsQuerySchema
>;
