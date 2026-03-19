import * as transferService from "./transferService";
import type { Request, Response, NextFunction } from "express";

export async function createTransfer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { accountId } = (req as any).validated.params;
    const body = (req as any).validated.body;
    const authInput = req.user;
    const newTransfer = await transferService.insertTransfer(accountId, body, authInput);
    res.status(201).json(newTransfer);
  } catch (err) {
    next(err);
  }
}

export async function getTransfer(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const { accountId, transferId } = (req as any).validated.params;
    const authInput = req.user;
    const transfer = await transferService.fetchTransferById(transferId, authInput);
    res.status(200).json(transfer);
  } catch (err) {
    next(err);
  }
}

export async function getTransfers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { accountId } = (req as any).validated.params;
    const query = (req as any).validated.query;
    const authInput = req.user;
    const transfers = await transferService.fetchTransfers(accountId, query, authInput);
    res.status(200).json(transfers);
  } catch (err) {
    next(err);
  }
}
