import { z } from "zod";

export const CreateTourTypeDto = z.object({
  name: z.string().min(3, "name es requerido"),
  description: z.string().min(10, "description es requerido"),
});

export type CreateTourTypeDto = z.infer<typeof CreateTourTypeDto>;
