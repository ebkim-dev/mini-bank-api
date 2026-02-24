import type { Request, Response, NextFunction } from "express";
import * as authService from "./authService";
import type {
  RegisterInput,
  LoginInput,
} from '../types/user';

export async function register(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const data: RegisterInput = (req as any).validated.body;
    const newUser = await authService.registerUser(data);
    res.status(201).json(newUser);
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
    const user = await authService.loginUser(data);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}