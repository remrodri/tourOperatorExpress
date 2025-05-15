import { z } from "zod";

export const CreatePaymentDto = z.object({
  amount: z.number().min(1, "El monto debe ser mayor a 0"),
  paymentDate: z.string().min(1, "La fecha de pago es requerida"),
  paymentMethod: z.string().min(1, "El metodo de pago es requerido"),
  transactionId: z.string().optional(),
  bookingId: z.string().optional(),
});
export type CreatePaymentDto = z.infer<typeof CreatePaymentDto>;
