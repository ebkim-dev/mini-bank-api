import type { Request, Response, NextFunction } from "express";
import type { 
  AccountCreateInput,
  AccountUpdateInput,
  AccountOutput,
} from "./account";
import * as accountService from "./accountService";
import type { JwtPayload } from '../auth/user';

export async function createAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body: AccountCreateInput = (req as any).validated.body;
    const jwtPayload: JwtPayload = (req as any).validated.user;
    const newAccount: AccountOutput = await accountService.insertAccount(
      body, 
      { 
        actorId: jwtPayload.sub,
        role: jwtPayload.role
      }
    );
    res.status(201).json(newAccount);
  } catch (err) {
    next(err);
  }
}

export async function getAccountsByCustomerId(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { customer_id } = (req as any).validated.query;
    const jwtPayload: JwtPayload = (req as any).validated.user;
    const accounts: AccountOutput[] = await accountService.fetchAccountsByCustomerId(
      customer_id,
      { 
        actorId: jwtPayload.sub,
        role: jwtPayload.role
      }
    );
    res.status(200).json(accounts);
  } catch (err) {
    next(err);
  }
}

export async function getAccount(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const { id } = (req as any).validated.params;
    const jwtPayload: JwtPayload = (req as any).validated.user;
    const account: AccountOutput = await accountService.fetchAccountById(
      id,
      { 
        actorId: jwtPayload.sub,
        role: jwtPayload.role
      }
    );
    res.status(200).json(account);
  } catch (err) {
    next(err);
  }
}

export async function updateAccount(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const { id } = (req as any).validated.params;
    const body: AccountUpdateInput = (req as any).validated.body;
    const jwtPayload: JwtPayload = (req as any).validated.user;
    const updated: AccountOutput = await accountService.updateAccountById(
      id,
      body,
      { 
        actorId: jwtPayload.sub,
        role: jwtPayload.role
      }
    );
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const { id } = (req as any).validated.params;
    const jwtPayload: JwtPayload = (req as any).validated.user;
    const closed: AccountOutput = await accountService.deleteAccountById(
      id,
      { 
        actorId: jwtPayload.sub,
        role: jwtPayload.role
      }
    );
    res.status(200).json(closed);
  } catch (err) {
    next(err);
  }
}
