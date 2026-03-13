import type { Request, Response, NextFunction } from "express";
import type {
  TransactionCreateInput,
  TransactionOutput,
} from "./transaction";
import type { AuthInput } from "../auth/user";
import * as transactionService from "./transactionService";

export async function createTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body: TransactionCreateInput = (req as any).validated.body;
    const authInput: AuthInput = req.user;
    const newTransaction: TransactionOutput =
      await transactionService.insertTransaction(body, authInput);
    res.status(201).json(newTransaction);
  } catch (err) {
    next(err);
  }
}


export async function getTransactionById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = (req as any).validated.params;
    const authInput: AuthInput = req.user;
    const transaction: TransactionOutput =
      await transactionService.fetchTransactionById(id, authInput);
    res.status(200).json(transaction);
  } catch (err) {
    next(err);
  }
}