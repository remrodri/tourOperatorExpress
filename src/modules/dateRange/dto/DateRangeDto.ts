import { z } from "zod";

export const DateRangeDto = z.object({
  dates: z.array(z.string()),
  state: z.string().default("active"),
});

export type DateRangeDto = z.infer<typeof DateRangeDto>;
