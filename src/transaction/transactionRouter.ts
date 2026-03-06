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
import { jwtPayloadSchema } from "../auth/userSchemas";

const router = Router();

router.post(
  "/",
  requireAuth(),
  validate(createTransactionBodySchema, "body"),
  validate(jwtPayloadSchema, "user"),
  createTransaction
);

router.get(
  "/",
  requireAuth(),
  validate(getTransactionsQuerySchema, "query"),
  validate(jwtPayloadSchema, "user"),
  getTransactions
);

router.get(
  "/:id",
  requireAuth(),
  validate(transactionIdParamsSchema, "params"),
  validate(jwtPayloadSchema, "user"),
  getTransactionById
);

export default router;