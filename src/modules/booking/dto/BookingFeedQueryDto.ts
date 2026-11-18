import { Types } from "mongoose";
import { z } from "zod";

const optionalObjectId = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || Types.ObjectId.isValid(value), {
    message: "Identificador inválido",
  });

export const BookingFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().trim().min(1).optional(),
  status: z
    .enum(["pending", "confirmed", "cancelled", "completed"])
    .optional(),
  bookingCode: z.string().trim().min(1).max(120).optional(),
  tourPackageId: optionalObjectId,
  dateRangeId: optionalObjectId,
});

export type BookingFeedQueryDto = z.infer<typeof BookingFeedQuerySchema>;

export const BookingDateRangeSummaryQuerySchema = z.object({
  dateRangeId: z
    .string()
    .trim()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: "dateRangeId inválido",
    }),
  tourPackageId: optionalObjectId,
});

export type BookingDateRangeSummaryQueryDto = z.infer<
  typeof BookingDateRangeSummaryQuerySchema
>;
