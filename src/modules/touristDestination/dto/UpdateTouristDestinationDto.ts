import { z } from "zod";

export const UpdateTouristDestinationDto = z.object({
  name: z.string().min(3, "Es requerido"),
  description: z.string().min(3, "Es requerido"),
});
export type UpdateTouristDestinationDto = z.infer<
  typeof UpdateTouristDestinationDto
>;
