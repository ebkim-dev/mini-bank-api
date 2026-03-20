import { Router } from "express";
import { login, logout, me, register } from "./authController";
import { validate } from "../middleware/validationMiddleware";
import { loginBodySchema, registerBodySchema } from "./userSchemas";
import { requireAuth } from "./authMiddleware";

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

router.post(
  "/logout",
  requireAuth(),
  logout
);
 
router.get(
  "/me",
  requireAuth(),
  me
);
 

export default router;
