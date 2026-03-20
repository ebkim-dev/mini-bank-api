import type { Request, Response, NextFunction } from "express";
import * as authService from "./authService";
import type {
  RegisterInput,
  RegisterOutput,
  LoginInput,
  LoginOutput,
  MeOutput,
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


export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = req.sessionId!;
    const authInput = req.user!;
    await authService.logoutUser(sessionId, authInput);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
 
export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authInput = req.user!;
    const meOutput: MeOutput = await authService.fetchMe(authInput);
    res.status(200).json(meOutput);
  } catch (err) {
    next(err);
  }
}