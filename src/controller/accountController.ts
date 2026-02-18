import type { Request, Response, NextFunction } from "express";
import * as accountService from "../service/accountService";
import { serializeAccount, serializeAccounts, getValidated } from "../utils/helpers";
import { AccountCreateInput, AccountUpdateInput } from "../types/account";

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
    const { customerId } = getValidated<{ customerId: bigint }>(req, "query");
    const accounts = await accountService.fetchAccountsByCustomerId(customerId);
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
    const { accountId } = getValidated<{ accountId: bigint }>(req, "params");
    const account = await accountService.fetchAccountById(accountId);
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
    const { accountId } = getValidated<{ accountId: bigint }>(req, "params");
    const body = getValidated<AccountUpdateInput>(req, "body");
    const updated = await accountService.updateAccountById(accountId, body);
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
    const { accountId } = getValidated<{ accountId: bigint }>(req, "params");
    const closed = await accountService.deleteAccountById(accountId);
    res.status(200).json(serializeAccount(closed));
  } catch (err) {
    next(err);
  }
}
