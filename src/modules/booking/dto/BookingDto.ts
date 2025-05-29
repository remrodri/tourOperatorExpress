import { z } from "zod";

const BookingDto = z.object({
  id: z.string(),
  additionalTouristIds: z.array(z.string()),
  mainTouristId: z.string(),
  paymentIds: z.array(z.string()),
  tourPackageId: z.string(),
  dateRangeId: z.string(),
  sellerId: z.string(),
  totalPrice: z.number(),
  notes: z.string().optional(),
  status: z.string().default("pending"), 
});

export type BookingDto = z.infer<typeof BookingDto>;
