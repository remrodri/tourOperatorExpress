import { z } from "zod";

export const CreatePaymentDto = z.object({
  amount: z.number().min(1, "El monto debe ser mayor a 0"),
  paymentDate: z.string().min(1, "La fecha de pago es requerida"),
  paymentMethod: z.string().min(1, "El metodo de pago es requerido"),
  bookingId: z.string().min(1, "El id de la reserva es requerida para crear un pago"),
  paymentProofImage: z.string().optional(),
  sellerId: z.string().min(1, "El id del vendedor es requerido para crear un pago"),
  touristId: z.string().min(1, "El id del turista es requerido para crear un pago"),
});
export type CreatePaymentDto = z.infer<typeof CreatePaymentDto>;
