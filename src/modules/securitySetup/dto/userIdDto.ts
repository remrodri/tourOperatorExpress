import { z } from "zod";

export const GetQuestionsDto = z.object({
  userId: z.string({ message: "El user Id es requerido" }),
});

export type GetQuestionsDto = z.infer<typeof GetQuestionsDto>;
