import { Types } from "mongoose";
import { z } from "zod";

export const AnalyticsDepartureParamsSchema = z
  .object({
    id: z
      .string()
      .trim()
      .refine((value) => Types.ObjectId.isValid(value), {
        message: "Identificador de salida inválido",
      }),
  })
  .strict();

export type AnalyticsDepartureParamsDto = z.infer<
  typeof AnalyticsDepartureParamsSchema
>;
