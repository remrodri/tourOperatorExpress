import { z } from "zod";

export const DeleteUserDto = z.object({
  userId: z.string(),
});

export type DeleteUserDto = z.infer<typeof DeleteUserDto>;
