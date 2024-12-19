import { object, z } from "zod";

export const UpdateAnswersDto = z.array(
  z.object({
    answerId: z.string({ message: "El answerId es requerido" }),
    answerText: z.string({
      message: "El contenido de la respuesta es requerido",
    }),
  })
);
export type UpdateAnswersDto = z.infer<typeof UpdateAnswersDto>;
