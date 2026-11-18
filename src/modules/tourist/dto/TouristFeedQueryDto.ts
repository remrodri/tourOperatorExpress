import { z } from "zod";

export const TouristFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export type TouristFeedQueryDto = z.infer<typeof TouristFeedQuerySchema>;

export const TouristIdsQuerySchema = z.object({
  ids: z
    .string()
    .trim()
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    )
    .refine((ids) => ids.length > 0 && ids.length <= 100, {
      message: "Debes enviar entre 1 y 100 identificadores",
    }),
});
