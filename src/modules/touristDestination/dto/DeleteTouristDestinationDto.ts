import { z } from "zod";

export const DeleteTouristDestinationDto = z.object({
  id: z.string().min(1, "Es requerido"),
});
export type DeleteTouristDestinationDto = z.infer<
  typeof DeleteTouristDestinationDto
>;
