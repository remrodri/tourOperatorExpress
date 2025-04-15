import { z } from "zod";

export const DateRangeDto = z.object({
  dates: z.array(z.string()),
  state: z.string().default("active"),
  guides:z.string().array().optional(),
});

export type DateRangeDto = z.infer<typeof DateRangeDto>;
