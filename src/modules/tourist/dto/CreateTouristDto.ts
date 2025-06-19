import { z } from "zod";

const CreateTouristDtoSchema = z.object({
  firstName: z.string().min(3, "El nombre debe tener almenos 3 caracteres"),
  lastName: z.string().min(3, "El apellido debe tener almenos 3 caracteres"),
  phone: z.string().min(8, "El telefono debe tener almenos 8 caracteres"),
  email: z.string().email("El email no es valido"),
  nationality: z
    .string()
    .min(3, "La nacionalidad debe tener almenos 3 caracteres"),
  documentType: z
    .string()
    .min(3, "El tipo de documento debe tener almenos 3 caracteres"),
  ci: z.string().optional(),
  passportNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  // status: z.string().default("active"),
  bookingIds: z.array(z.string()).optional(),
});

export type CreateTouristDto = z.infer<typeof CreateTouristDtoSchema>
