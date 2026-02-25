import { z } from "zod";
import { UserRole } from "../generated/enums";

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

export const jwtPayloadSchema = z
  .object({
    sub: z.string(),
    role: z.enum(UserRole),
    iat: z.number(),
    exp: z.number()
  })
  .strict();

  
