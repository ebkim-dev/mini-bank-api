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

const router = Router();

router.post(
  "/",
  validate(createAccountBodySchema, "body"),
  createAccount
);

router.get(
  "/",
  validate(getAccountsQuerySchema, "query"),
  getAccountsByCustomerId
);

router.get(
  "/:id",
  validate(accountIdParamsSchema, "params"),
  getAccount
);

router.put(
  "/:id",
  validate(accountIdParamsSchema, "params"),
  validate(updateAccountBodySchema, "body"),
  updateAccount
);

router.post(
  "/:id/close",
  validate(accountIdParamsSchema, "params"),
  deleteAccount
);

export default router;
