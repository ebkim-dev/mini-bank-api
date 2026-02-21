import type { Request, Response, NextFunction } from "express";
import * as authService from "./authService";
import { serializeAccount, serializeAccounts, getValidated } from "../utils/helpers";
import { AccountCreateInput } from "../types/account";
import type {
  UserRegisterInput,
  UserLoginInput,
  UserOutput,
  LoginOutput,
} from '../types/user';

export async function register(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const body = getValidated<UserRegisterInput>(req, "body");
    const newUser = await authService.registerUser(body);
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
}

