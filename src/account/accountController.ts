import type { Request, Response, NextFunction } from "express";
import type { 
  AccountCreateInput,
  AccountUpdateInput,
  AccountOutput,
} from "./account";
import * as accountService from "./accountService";
import type { AuthInput } from '../auth/user';

export async function createAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body: AccountCreateInput = (req as any).validated.body;
    const authInput: AuthInput = req.user;
    const newAccount: AccountOutput = await accountService.insertAccount(
      body, 
      authInput
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
    const authInput: AuthInput = req.user;
    const accounts: AccountOutput[] = await accountService.fetchAccountsByCustomerId(
      customer_id,
      authInput
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
    const authInput: AuthInput = req.user;
    const account: AccountOutput = await accountService.fetchAccountById(
      id,
      authInput
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
    const authInput: AuthInput = req.user;
    const updated: AccountOutput = await accountService.updateAccountById(
      id,
      body,
      authInput
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
    const authInput: AuthInput = req.user;
    const closed: AccountOutput = await accountService.deleteAccountById(
      id,
      authInput
    );
    res.status(200).json(closed);
  } catch (err) {
    next(err);
  }
}
