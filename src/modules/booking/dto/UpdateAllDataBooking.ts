import { z } from "zod";

const TouristSchema = z.object({
  id: z.string(),
  firstName: z.string().min(3, "El nombre debe tener almenos 3 caracteres"),
  lastName: z.string().min(3, "El apellido debe tener almenos 3 caracteres"),
  email: z.string().email("El email no es valido"),
  phone: z.string().min(8, "El telefono debe tener almenos 8 caracteres"),
  ci: z.string().optional(),
  nationality: z.string().min(3, "La nacionalidad debe tener almenos 3 caracteres"),
  dateOfBirth: z.string(),
  passportNumber: z.string().optional(),
  documentType: z.string().min(1, "El tipo de documento es requerido"),
  // bookingIds: z.array(z.string()).optional(),
});

export const UpdateAllDataBookingDto = z.object({
  // id: z.string(),
  // tourPackageId: z.string().min(1, "El id del paquete turistico es requerido"),
  // dateRangeId: z.string().min(1, "El id del rango de fechas es requerido"),
  // sellerId: z.string().min(1, "El id del vendedor es requerido"),
  // mainTourist: TouristSchema,
  // additionalTourists: z.array(TouristSchema),
  tourists: z.array(TouristSchema),
  totalPrice: z.number().min(1, "El precio total debe ser mayor a 0"),
  // payments: z.array(PaymentSchema),
  notes: z.string().optional(),
  status: z.string().default("pending"),
});

export type UpdateAllDataBookingDto = z.infer<typeof UpdateAllDataBookingDto>;