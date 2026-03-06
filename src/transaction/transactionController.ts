import type { Request, Response, NextFunction } from "express";
import type {
  TransactionCreateInput,
  TransactionOutput,
  TransactionQueryInput,
} from "./transaction";
import type { JwtPayload } from "../auth/user";
import * as transactionService from "./transactionService";

export async function createTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body: TransactionCreateInput = (req as any).validated.body;
    const jwtPayload: JwtPayload = (req as any).validated.user;
    const newTransaction: TransactionOutput =
      await transactionService.insertTransaction(body, {
        actorId: jwtPayload.sub,
        role: jwtPayload.role,
      });
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
    const query: TransactionQueryInput = (req as any).validated.query;
    const jwtPayload: JwtPayload = (req as any).validated.user;
    const transactions: TransactionOutput[] =
      await transactionService.fetchTransactions(query, {
        actorId: jwtPayload.sub,
        role: jwtPayload.role,
      });
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
    const { id } = (req as any).validated.params;
    const jwtPayload: JwtPayload = (req as any).validated.user;
    const transaction: TransactionOutput =
      await transactionService.fetchTransactionById(id, {
        actorId: jwtPayload.sub,
        role: jwtPayload.role,
      });
    res.status(200).json(transaction);
  } catch (err) {
    next(err);
  }
}