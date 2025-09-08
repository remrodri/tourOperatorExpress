import { z } from "zod";

export const CancelBookingDto = z.object({
  // id: z.string(),
  cancellationFee: z.number(),
  refundAmount: z.number(),
  refundedAt: z.string(),
  status: z.string().default("cancelled"),
});

export type CancelBookingDto = z.infer<typeof CancelBookingDto>;

