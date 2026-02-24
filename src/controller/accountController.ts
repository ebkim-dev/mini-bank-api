import type { Request, Response, NextFunction } from "express";
import * as accountService from "../service/accountService";
import { 
  AccountCreateInput,
  AccountUpdateInput,
  AccountOutput,
} from "../types/account";

export async function createAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body: AccountCreateInput = (req as any).validated.body;
    const newAccount: AccountOutput = await accountService.insertAccount(body);
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
    const accounts: AccountOutput[] = await accountService.fetchAccountsByCustomerId(customer_id);
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
    const account: AccountOutput = await accountService.fetchAccountById(id);
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
    const updated: AccountOutput = await accountService.updateAccountById(id, body);
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
    const closed: AccountOutput = await accountService.deleteAccountById(id);
    res.status(200).json(closed);
  } catch (err) {
    next(err);
  }
}
