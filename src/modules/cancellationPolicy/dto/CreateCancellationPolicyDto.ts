import { z } from "zod";

export const CreateCancellationPolicyDto = z.object({
  name: z.string().min(3, "Es requerido"),
  deadLine: z.number().nonnegative("Debe ser positivo").int("Debe ser entero"),
  refoundPercentage: z
    .number()
    .nonnegative("Debe ser positivo")
    .int("Debe ser entero"),
  description: z.string().min(3, "Es requerido"),
});
export type CreateCancellationPolicyDto = z.infer<
  typeof CreateCancellationPolicyDto
>;
