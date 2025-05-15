import { z } from "zod";

const TouristSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("El email no es valido"),
  phone: z.string().optional(),
  ci: z.string().optional(),
  nationality: z.string().optional(),
  passportNumber: z.string().optional(),
  documentType: z.string().optional(),
  dateOfBirth: z.string().optional(),
  // status: z.string().default("active"),
});

const PaymentSchema = z.object({
  amount: z.number().optional(),
  paymentDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
});

export const UpdateBookingDto = z.object({
  additionalTourists: z.array(TouristSchema),
  // additionalTourists: z.array(z.string()),
  dateRangeId: z.string().optional(),
  mainTourist: TouristSchema,
  // mainTourist: z.string(),
  notes: z.string().optional(),
  payments: z.array(PaymentSchema).optional(),
  sellerId: z.string().optional(),
  status: z.string().default("pending"),
  totalPrice: z.number().optional(),
  tourPackageId: z.string().optional(),
});

export type UpdateBookingDto = z.infer<typeof UpdateBookingDto>;
