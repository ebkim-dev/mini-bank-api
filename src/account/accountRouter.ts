import { Router } from "express";
import {
  createAccount,
  getAccountsByCustomerId,
  getAccount,
  updateAccount,
  deleteAccount,
} from "./accountController";

import { validate } from "../middleware/validationMiddleware";
import {
  createAccountBodySchema,
  updateAccountBodySchema,
  getAccountsQuerySchema,
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
  validate(getAccountsQuerySchema, "query"),
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

export default router;
