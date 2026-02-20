import type { Request, Response, NextFunction } from "express";
import * as accountService from "../service/accountService";
import { serializeAccount, serializeAccounts, getValidated } from "../utils/helpers";
import { AccountCreateInput } from "../types/account";

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

