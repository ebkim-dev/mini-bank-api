import { z } from "zod";

export const registerBodySchema = z
  .object({
    username: z.string().min(3).max(32),
    password: z.string().min(8).max(128),
  })
  .strict();

export const loginBodySchema = z
  .object({
    username: z.string().min(3).max(32),
    password: z.string().min(8).max(128),
  })
  .strict();