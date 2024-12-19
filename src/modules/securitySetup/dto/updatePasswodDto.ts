import { z } from "zod";

export const UpdatePasswordDto = z.object({
  userId: z.string({ message: "El userId es requerido" }),
  newPassword: z.string().min(6, "Debe tener alemnos 6 caracteres"),
});

export type UpdatePasswordDto = z.infer<typeof UpdatePasswordDto>;
