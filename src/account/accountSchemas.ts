import { z } from "zod";
import { AccountType, AccountStatus } from "../generated/enums";
import { Decimal } from "@prisma/client/runtime/client";



export const accountIdParamsSchema = z
  .object({
    id: z.uuid("id must be a valid UUID"),
  })
  .strict();

export const getAccountsQuerySchema = z
  .object({
    customer_id: z.uuid("customerId must be a valid UUID"),
  })
  .strict();

export const createAccountBodySchema = z
  .object({
    customer_id: z.uuid("customerId must be a valid UUID"),
    type: z.enum(AccountType),
    currency: z
      .string()
      .length(3, "currency must be exactly 3 characters")
      .transform((s) => s.toUpperCase()),
    nickname: z.string().max(100).optional().nullable(),
    status: z.enum(AccountStatus).optional().default(AccountStatus.ACTIVE),
    balance: z.string().optional().default("0").transform((x) => new Decimal(x)),
  })
  .strict();

export const updateAccountBodySchema = z
  .object({
    nickname: z.string().max(100).optional().nullable(),
    status: z.enum(AccountStatus).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field (nickname/status) must be provided",
  });