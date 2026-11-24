import { z } from "zod";

export const AnalyticsEconomicsQuerySchema = z.object({
  horizonDays: z.coerce.number().pipe(
    z.union([z.literal(7), z.literal(14), z.literal(30)], {
      errorMap: () => ({ message: "horizonDays debe ser 7, 14 o 30" }),
    }),
  ).default(14),
}).strict();

export type AnalyticsEconomicsQueryDto = z.infer<typeof AnalyticsEconomicsQuerySchema>;
