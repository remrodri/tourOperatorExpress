import { z } from "zod";

const TouristSchema = z.object({
  firstName: z.string().min(3, "El nombre debe tener almenos 3 caracteres"),
  lastName: z.string().min(3, "El apellido debe tener almenos 3 caracteres"),
  email: z.string().email("El email no es valido"),
  phone: z.string().min(8, "El telefono debe tener almenos 8 caracteres"),
  ci: z.string().optional(),
  nationality: z
    .string()
    .min(3, "La nacionalidad debe tener almenos 3 caracteres"),
  passportNumber: z.string().optional(),
  documentType: z.string().min(1, "El tipo de documento es requerido"),
  dateOfBirth: z.string().optional(),
  // status: z.string().default("active"),
});

const PaymentSchema = z.object({
  amount: z.number().min(1, "El monto debe ser mayor a 0"),
  paymentDate: z.string().optional(),
  paymentMethod: z.string().min(1, "El metodo de pago es requerido"),
  transactionId: z.string().optional(),
});

export const CreateBookingDto = z.object({
  additionalTourists: z.array(TouristSchema),
  // additionalTourists: z.array(z.string()),
  dateRangeId: z.string().min(1, "El id del rango de fechas es requerido"),
  mainTourist: TouristSchema,
  // mainTourist: z.string(),
  notes: z.string().optional(),
  payments: z.array(PaymentSchema).min(1, "Se requiere al menos un pago"),
  sellerId: z.string().min(1, "El id del vendedor es requerido"),
  status: z.string().default("pending"),
  totalPrice: z.number().min(1, "El precio total debe ser mayor a 0"),
  tourPackageId: z.string().min(1, "El id del paquete turistico es requerido"),
});

export type CreateBookingDto = z.infer<typeof CreateBookingDto>;
