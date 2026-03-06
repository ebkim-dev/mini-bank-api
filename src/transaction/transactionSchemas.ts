import { z } from "zod";
import { TransactionType } from "../generated/enums";

export const createTransactionBodySchema = z
  .object({
    account_id: z.uuid("account_id must be a valid UUID"),
    type: z.enum(TransactionType),
    amount: z
      .string()
      .refine((val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
      }, { message: "amount must be a positive number" }),
    description: z.string().max(255).optional(),
    category: z.string().max(100).optional(),
  })
  .strict();

export const getTransactionsQuerySchema = z
  .object({
    account_id: z.uuid("account_id must be a valid UUID"),
    limit: z
      .string()
      .optional()
      .default("20")
      .transform((val) => parseInt(val, 10))
      .refine((val) => val >= 1 && val <= 100, {
        message: "limit must be between 1 and 100",
      }),
    offset: z
      .string()
      .optional()
      .default("0")
      .transform((val) => parseInt(val, 10))
      .refine((val) => val >= 0, {
        message: "offset must be 0 or greater",
      }),
    type: z.enum(TransactionType).optional(),
    from: z.string().datetime({ message: "from must be a valid ISO date" }).optional(),
    to: z.string().datetime({ message: "to must be a valid ISO date" }).optional(),
  })
  .strict();

export const transactionIdParamsSchema = z
  .object({
    id: z.uuid("id must be a valid UUID"),
  })
  .strict();