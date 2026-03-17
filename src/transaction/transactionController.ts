import type { Request, Response, NextFunction } from "express";
import type {
  TransactionCreateInput,
  TransactionOutput,
  TransactionQueryInput,
} from "./transaction";
import type { AuthInput } from "../auth/user";
import * as transactionService from "./transactionService";

export async function createTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { accountId } = (req as any).validated.params;
    const body: TransactionCreateInput = (req as any).validated.body;
    const authInput: AuthInput = req.user;

    const newTransaction: TransactionOutput =
      await transactionService.insertTransaction(accountId, body, authInput);
    res.status(201).json(newTransaction);
  } catch (err) {
    next(err);
  }
}

export async function getTransactions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { accountId } = (req as any).validated.params;
    const query: TransactionQueryInput = (req as any).validated.query;
    const authInput: AuthInput = req.user;

    const transactions: TransactionOutput[] =
      await transactionService.fetchTransactions(accountId, query, authInput);
    res.status(200).json(transactions);
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
    const { transactionId } = (req as any).validated.params;
    const authInput: AuthInput = req.user;
    const transaction: TransactionOutput =
      await transactionService.fetchTransactionById(transactionId, authInput);
    res.status(200).json(transaction);
  } catch (err) {
    next(err);
  }
}