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
    sub: z.uuid("sub must be a valid UUID"),
    role: z.enum(UserRole),
  });

export const sessionIdSchema = z
  .object({
    "x-session-id": z.uuid(),
  })
  .strict();


