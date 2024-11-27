import { z } from "zod";

export const UserRequestDto = z.object({
  email: z.string().email({ message: "Formato invalido" }),
  password: z
    .string()
    .min(6, { message: "el password debe tener almenos 6 caracteres" }),
});

export type UserRequestDto = z.infer<typeof UserRequestDto>;
