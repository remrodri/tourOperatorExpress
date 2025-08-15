import { z } from "zod";

export const UpdateDateRangeDto = z.object({
  dates: z.array(z.string()).optional(),
  state: z.string().optional(),
  guides:z.string().array().optional(),
  tourPackageId:z.string().optional(),
});

export type UpdateDateRangeDto = z.infer<typeof UpdateDateRangeDto>;
