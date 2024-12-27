import { z } from "zod";

export const GetRandomQuestionDto = z.object({
  email: z.string({ message: "El email es requerido" }),
});

export type GetRandomQuestionDto = z.infer<typeof GetRandomQuestionDto>;
