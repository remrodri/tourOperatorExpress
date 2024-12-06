import { z } from "zod";

export const CreateUserDto = z.object({
  firstName: z.string().min(3, "firstName es requerido"),
  lastName: z.string().min(3, "lastName es requerido"),
  email: z.string().email("email no es valido"),
  phone: z.string().min(8, "phone debe tener al menos 8 digitos"),
  ci: z.string().min(7, "ci debe tener almenos 7 caracteres"),
  role: z.string({ message: "role es requerido" }),
});

export type CreateUserDto = z.infer<typeof CreateUserDto>;
