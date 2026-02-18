import { Router } from "express";
import {
  createAccount,
  getAccountsByCustomerId,
  getAccount,
  updateAccount,
  deleteAccount,
} from "../controller/accountController";

import { validate } from "../middleware/validationMiddleware";
import {
  createAccountBodySchema,
  updateAccountBodySchema,
  getAccountsQuerySchema,
  accountIdParamsSchema,
} from "../validationSchemas/accountSchemas";

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
  "/:accountId",
  validate(accountIdParamsSchema, "params"),
  getAccount
);

router.put(
  "/:accountId",
  validate(accountIdParamsSchema, "params"),
  validate(updateAccountBodySchema, "body"),
  updateAccount
);

router.post(
  "/:accountId/close",
  validate(accountIdParamsSchema, "params"),
  deleteAccount
);

export default router;
