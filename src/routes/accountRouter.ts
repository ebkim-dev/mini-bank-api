import { Router } from "express";
import {
  createAccount,
  getAccountsByCustomerId,
  getAccount,
  updateAccount,
  deleteAccount,
} from "../controller/accountController";

import { validate } from "../middleware/validate";
import {
  createAccountBodySchema,
  updateAccountBodySchema,
  getAccountsQuerySchema,
  accountIdParamsSchema,
} from "../validation/accountSchemas";

const router = Router();

// POST /accounts
router.post(
  "/",
  validate(createAccountBodySchema, "body"),
  createAccount
);

// GET /accounts?customerId=...
router.get(
  "/",
  validate(getAccountsQuerySchema, "query"),
  getAccountsByCustomerId
);

// GET /accounts/:id
router.get(
  "/:id",
  validate(accountIdParamsSchema, "params"),
  getAccount
);

// PUT /accounts/:id
router.put(
  "/:id",
  validate(accountIdParamsSchema, "params"),
  validate(updateAccountBodySchema, "body"),
  updateAccount
);

// POST /accounts/:id/close
router.post(
  "/:id/close",
  validate(accountIdParamsSchema, "params"),
  deleteAccount
);

export default router;
