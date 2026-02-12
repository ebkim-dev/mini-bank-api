import { z } from "zod";


const zBigIntFromAny = z.preprocess((val) => {
  if (typeof val === "bigint") return val;
  if (typeof val === "number" && Number.isInteger(val)) return BigInt(val);
  if (typeof val === "string" && val.trim() !== "" && /^[0-9]+$/.test(val)) return BigInt(val);
  return val; 
}, z.bigint());


export const accountIdParamsSchema = z.object({
  id: z.string().min(1).regex(/^[0-9]+$/, "id must be a numeric string"),
});


export const getAccountsQuerySchema = z.object({
  customerId: z.string().min(1).regex(/^[0-9]+$/, "customerId must be a numeric string"),
});


export const createAccountBodySchema = z.object({
  customer_id: zBigIntFromAny,
  type: z.enum(["CHECKING", "SAVINGS"]),
  currency: z
    .string()
    .length(3, "currency must be exactly 3 characters")
    .transform((s) => s.toUpperCase()),
  nickname: z.string().max(100).optional().nullable(),
});


export const updateAccountBodySchema = z
  .object({
    nickname: z.string().max(100).optional(), // ✅ no null
    status: z.enum(["ACTIVE", "CLOSED"]).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field (nickname/status) must be provided",
  });