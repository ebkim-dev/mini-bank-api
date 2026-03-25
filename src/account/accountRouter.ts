import { Router } from "express";
import { validate } from "../middleware/validationMiddleware";
import { requireAuth } from "../auth/authMiddleware";
import {
  createAccount,
  getAccountsByCustomerId,
  getAccount,
  updateAccount,
  deleteAccount,
  getAccountSummary
} from "./accountController";
import {
  createAccountBodySchema,
  updateAccountBodySchema,
  accountIdParamsSchema,
} from "./accountSchemas";

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

router.get(
  "/:id/summary",
  requireAuth(),
  validate(accountIdParamsSchema, "params"),
  getAccountSummary
);

export default router;