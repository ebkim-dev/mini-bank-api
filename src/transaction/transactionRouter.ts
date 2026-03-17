import { Router } from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
} from "./transactionController";
import { validate } from "../middleware/validationMiddleware";
import {
  accountIdParamsSchema,
  createTransactionBodySchema,
  getTransactionsQuerySchema,
  transactionIdParamsSchema,
} from "./transactionSchemas";
import { requireAuth } from "../auth/authMiddleware";

const router = Router({ mergeParams: true });

router.post(
  "/",
  requireAuth(),
  validate(accountIdParamsSchema, "params"),
  validate(createTransactionBodySchema, "body"),
  createTransaction
);

router.get(
  "/",
  requireAuth(),
  validate(accountIdParamsSchema, "params"),
  validate(getTransactionsQuerySchema, "query"),
  getTransactions
);

router.get(
  "/:transactionId",
  requireAuth(),
  validate(transactionIdParamsSchema, "params"),
  getTransactionById
);

export default router;