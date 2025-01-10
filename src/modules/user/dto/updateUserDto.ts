import { z } from "zod";

export const UpdateUserDto = z.object({
  firstName: z.string().min(3, "firstName es requerido"),
  lastName: z.string().min(3, "lastName es requerido"),
  phone: z.string().min(8, "phone debe tener al menos 8 digitos"),
  email: z.string().email("email no es valido"),
  ci: z.string().min(7, "ci debe tener almenos 7 caracteres"),
  role: z.string({ message: "role es requerido" }),
  // password: z
  //   .string()
  //   .min(6, "password debe tener almenos 6 caracteres")
  //   ,
  userId: z.string(),
  address: z.string({ message: "address es requerido" }),
});

export type UpdateUserDto = z.infer<typeof UpdateUserDto>;
