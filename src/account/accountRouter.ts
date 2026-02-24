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
import { requireAuth, requireRole } from "../auth/authMiddleware";
import { jwtPayloadSchema } from "../auth/userSchemas";
import { UserRole } from "../generated/enums";

const router = Router();

router.post(
  "/",
  requireAuth(),
  requireRole(UserRole.ADMIN),
  validate(createAccountBodySchema, "body"),
  validate(jwtPayloadSchema, "user"),
  createAccount
);

router.get(
  "/",
  requireAuth(),
  validate(getAccountsQuerySchema, "query"),
  validate(jwtPayloadSchema, "user"),
  getAccountsByCustomerId
);

router.get(
  "/:id",
  requireAuth(),
  validate(accountIdParamsSchema, "params"),
  validate(jwtPayloadSchema, "user"),
  getAccount
);

router.put(
  "/:id",
  requireAuth(),
  requireRole(UserRole.ADMIN),
  validate(accountIdParamsSchema, "params"),
  validate(updateAccountBodySchema, "body"),
  validate(jwtPayloadSchema, "user"),
  updateAccount
);

router.post(
  "/:id/close",
  requireAuth(),
  requireRole(UserRole.ADMIN),
  validate(accountIdParamsSchema, "params"),
  validate(jwtPayloadSchema, "user"),
  deleteAccount
);

export default router;
