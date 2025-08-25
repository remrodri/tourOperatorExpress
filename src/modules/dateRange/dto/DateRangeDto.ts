import { z } from "zod";

export const DateRangeDto = z.object({
  dates: z.array(z.string()),
  state: z.string().default("pending"),
  guides:z.string().array().optional(),
  tourPackageId:z.string().optional(),
});

export type DateRangeDto = z.infer<typeof DateRangeDto>;
