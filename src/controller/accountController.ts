import type { Request, Response, NextFunction } from "express";
import * as accountService from "../service/accountService";
import { serializeAccount, serializeAccounts, getValidated } from "../utils/helpers";
import { AccountCreateInput, AccountUpdateInput } from "../types/account";
import { NotFoundError } from "../error/error"
import { ErrorCode } from "../types/errorCodes"

export async function createAccount(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const body = getValidated<AccountCreateInput>(req, "body");
    const newAccount = await accountService.insertAccount(body);
    res.status(201).json(serializeAccount(newAccount));
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
    const { customer_id } = getValidated<{ customer_id: bigint }>(req, "query");
    const accounts = await accountService.fetchAccountsByCustomerId(customer_id);
    if (accounts.length === 0) {
      throw NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, "Accounts not found", { customer_id });
    }
    res.status(200).json(serializeAccounts(accounts));
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
    const { id } = getValidated<{ id: bigint }>(req, "params");
    const account = await accountService.fetchAccountById(id);
    res.status(200).json(serializeAccount(account));
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
    const { id } = getValidated<{ id: bigint }>(req, "params");
    const body = getValidated<AccountUpdateInput>(req, "body");
    const updated = await accountService.updateAccountById(id, body);
    res.status(200).json(serializeAccount(updated));
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
    const { id } = getValidated<{ id: bigint }>(req, "params");
    const closed = await accountService.deleteAccountById(id);
    res.status(200).json(serializeAccount(closed));
  } catch (err) {
    next(err);
  }
}
