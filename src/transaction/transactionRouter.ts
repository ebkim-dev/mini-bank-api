import { Router } from "express";
import {
  createTransaction,
  getTransactionById,
} from "./transactionController";
import { validate } from "../middleware/validationMiddleware";
import {
  createTransactionBodySchema,
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
  "/:id",
  requireAuth(),
  validate(transactionIdParamsSchema, "params"),
  getTransactionById
);

export default router;