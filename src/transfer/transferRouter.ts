import { Router } from "express";
import { validate } from "../middleware/validationMiddleware";
import { requireAuth } from "../auth/authMiddleware";
import { accountIdParamsSchema } from "../account/accountSchemas";
import {
  createTransferBodySchema,
  getTransferParamsSchema,
  getTransfersQuerySchema
} from "./transferSchemas";
import {
  createTransfer,
  getTransfer,
  getTransfers
} from "./transferController";

const router = Router();

router.post(
  "/",
  requireAuth(),
  validate(createTransferBodySchema, "body"),
  createTransfer
);

router.get(
  "/:transferId",
  requireAuth(),
  validate(getTransferParamsSchema, "params"),
  getTransfer
);

router.get(
  "/",
  requireAuth(),
  validate(accountIdParamsSchema, "params"),
  validate(getTransfersQuerySchema, "query"),
  getTransfers
);

export default router;
