import { z } from "zod";

export const registerBodySchema = z
  .object({
    username: z.string().min(3).max(32),
    password: z.string().min(8).max(128),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.email().max(150),
    phone: z.string().trim().max(30).optional()
  })
  .strict();

export const loginBodySchema = z
  .object({
    username: z.string().min(3).max(32),
    password: z.string().min(8).max(128),
  })
  .strict();

export const sessionIdSchema = z
  .object({
    "x-session-id": z.uuid(),
  })
  .strict();


