import { z } from "zod";

export const DeleteTourPackageDto = z.object({
  id: z.string().min(1, "Es requerido"),
});
export type DeleteTourPackageDto = z.infer<typeof DeleteTourPackageDto>;
