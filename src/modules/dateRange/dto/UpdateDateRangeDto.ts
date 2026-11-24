import { z } from "zod";
import { parseLegacyDepartureDate } from "../domain/dateRangeNormalization";
import { EconomicPlanDto } from "./EconomicPlanDto";

const legacyDateSchema = z
  .string()
  .regex(/^\d{2}-\d{2}-\d{4}$/, "Formato de fecha inválido (DD-MM-YYYY)")
  .refine(
    (value) => parseLegacyDepartureDate(value) !== null,
    "La fecha de salida no existe en el calendario"
  );

export const UpdateDateRangeDto = z
  .object({
    dates: z.array(legacyDateSchema).min(1, "Se requiere al menos una fecha").optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    capacity: z
      .number()
      .int("La capacidad debe ser un número entero")
      .positive("La capacidad debe ser mayor a 0")
      .optional(),
    economicPlan: EconomicPlanDto.optional(),
    dataOrigin: z.enum(["legacy", "simulated", "manual"]).optional(),
    state: z.enum(["pending", "completed", "cancelled"]).optional(),
    guides: z.string().array().optional(),
    tourPackageId: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha final no puede ser anterior a la fecha inicial",
        path: ["endDate"],
      });
    }
  });

export type UpdateDateRangeDto = z.infer<typeof UpdateDateRangeDto>;
