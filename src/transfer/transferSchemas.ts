import { Decimal } from "@prisma/client/runtime/client";
import { z } from "zod";

export const createTransferBodySchema = z
  .object({
    toAccountId: z.uuid(),
    amount: z
      .string()
      .transform((val) => new Decimal(val))
      .refine((val) => val.isFinite() && val.gt(0)),
    memo: z.string().max(255).optional(),
  })
  .strict();

export const getTransfersQuerySchema = z
  .object({
    limit: z
      .string()
      .optional()
      .default("20")
      .transform((val) => Number.parseInt(val))
      .refine((val) => val >= 1 && val <= 100, {
        message: "limit must be between 1 and 100",
      }),
    offset: z
      .string()
      .optional()
      .default("0")
      .transform((val) => Number.parseInt(val))
      .refine((val) => val >= 0, {
        message: "offset must be 0 or greater",
      }),
    from: z
      .iso
      .datetime({ message: "from must be a valid ISO date" })
      .transform((val) => new Date(val))
      .refine((date) => !isNaN(date.getTime()), {
        message: "from must be a valid date"
      })
      .optional(),
    to: z
      .iso
      .datetime({ message: "to must be a valid ISO date" })
      .transform((val) => new Date(val))
      .refine((date) => !isNaN(date.getTime()), {
        message: "to must be a valid date"
      })
      .optional(),
  })
  .strict();

export const getTransferParamsSchema = z.object({
  accountId: z.uuid(),
  transferId: z.uuid(),
}).strict();

export const accountIdParamsSchema = z
  .object({
    accountId: z.uuid("accountId must be a valid UUID"),
  })
  .strict();