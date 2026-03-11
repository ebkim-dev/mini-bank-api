import type { Request, Response, NextFunction } from "express";
import * as authService from "./authService";
import type {
  RegisterInput,
  RegisterOutput,
  LoginInput,
  LoginOutput,
} from './user';

export async function register(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const data: RegisterInput = (req as any).validated.body;
    const registerOutput: RegisterOutput = await authService.registerUser(data);
    res.status(201).json(registerOutput);
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const data: LoginInput = (req as any).validated.body;
    const loginOutput: LoginOutput = await authService.loginUser(data);
    res.status(200).json(loginOutput);
  } catch (err) {
    next(err);
  }
}