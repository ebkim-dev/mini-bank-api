import { Router } from "express";
import {
  createAccount,
  getAccountsByCustomerId,
  getAccount,
  updateAccount,
  deleteAccount,
  getAccountSummary
} from "./accountController";
import { validate } from "../middleware/validationMiddleware";
import {
  createAccountBodySchema,
  updateAccountBodySchema,
  accountIdParamsSchema,
} from "./accountSchemas";
import { requireAuth } from "../auth/authMiddleware";

const router = Router();

router.post(
  "/",
  requireAuth(),
  validate(createAccountBodySchema, "body"),
  createAccount
);

router.get(
  "/",
  requireAuth(),
  getAccountsByCustomerId
);

router.get(
  "/:id",
  requireAuth(),
  validate(accountIdParamsSchema, "params"),
  getAccount
);

router.get(
  "/:id/summary",
  requireAuth(),
  validate(accountIdParamsSchema, "params"),
  getAccountSummary
);

router.put(
  "/:id",
  requireAuth(),
  validate(accountIdParamsSchema, "params"),
  validate(updateAccountBodySchema, "body"),
  updateAccount
);

router.post(
  "/:id/close",
  requireAuth(),
  validate(accountIdParamsSchema, "params"),
  deleteAccount
);

export default router;