import { z } from "zod";

export const UpdateBookingAttendanceListsDto = z.array(
  z.object({
    bookingId: z.string().min(1),
    attendance: z.array(
      z.object({
        touristId: z.string().min(1),
        status: z.enum(["present", "absent"]),
      })
    ),
  })
);
 export type UpdateBookingAttendanceListsDto = z.infer<typeof UpdateBookingAttendanceListsDto>;