import { z } from "zod";

const UpdateTouristDto = z.object({
  id: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("El email no es valido").optional(),
  nationality: z.string().optional(),
  documentType: z.string().optional(),
  ci: z.string().optional(),
  passportNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bookingIds: z.array(z.string()).optional(),
  // status: z.string().default("active"),
});

export type UpdateTouristDto = z.infer<typeof UpdateTouristDto>;
