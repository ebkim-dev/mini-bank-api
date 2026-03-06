import { Router } from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
} from "./transactionController";
import { validate } from "../middleware/validationMiddleware";
import {
  createTransactionBodySchema,
  getTransactionsQuerySchema,
  transactionIdParamsSchema,
} from "./transactionSchemas";
import { requireAuth } from "../auth/authMiddleware";

const router = Router();

router.post(
  "/",
  requireAuth(),
  validate(createTransactionBodySchema, "body"),
  createTransaction
);

router.get(
  "/",
  requireAuth(),
  validate(getTransactionsQuerySchema, "query"),
  getTransactions
);

router.get(
  "/:id",
  requireAuth(),
  validate(transactionIdParamsSchema, "params"),
  getTransactionById
);

export default router;