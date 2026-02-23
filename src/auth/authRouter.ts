import { Router } from "express";
import { login, register } from "./authController";
import { validate } from "../middleware/validationMiddleware";
import { loginBodySchema, registerBodySchema } from "../validationSchemas/userSchemas";

const router = Router();

router.post(
  "/register",
  validate(registerBodySchema, "body"),
  register
);

router.post(
  "/login",
  validate(loginBodySchema, "body"),
  login
);

export default router;
