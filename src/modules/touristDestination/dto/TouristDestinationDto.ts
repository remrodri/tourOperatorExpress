import { z } from "zod";

export const TouristDestinationDto = z.object({
  name: z.string().min(3, "Es requerido"),
  description: z.string().min(3, "Es requerido"),
  imageFolder: z.string().uuid("El identificador debe ser UUID").optional(),
  images: z.array(z.string()).optional(),
});
export type TouristDestinationDto = z.infer<typeof TouristDestinationDto>;
