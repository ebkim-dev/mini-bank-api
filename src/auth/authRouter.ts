import { Router } from "express";
import { register } from "./authController";
import { validate } from "../middleware/validationMiddleware";
import { registerUserBodySchema } from "../validationSchemas/userSchemas";

const router = Router();

router.post(
  "/login",
  validate(registerUserBodySchema, "body"),
  register
);

export default router;
