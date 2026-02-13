import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/client";

import * as accountService from "../service/accountService";
import { serializeAccount, serializeAccounts } from "../utils/serializeAccount";
import { AccountCreateInput, AccountStatus } from "../types/account";

import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from "../utils/error";

import { ErrorCode } from "../types/errorCodes";

export async function createAccount(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const data = (req as any).validated?.body as AccountCreateInput;
    
    if (!data) {
      throw BadRequestError(ErrorCode.EMPTY_BODY, "Request body is empty");
    }

    const newAccount = await accountService.insertAccount(data);
    res.status(201).json(serializeAccount(newAccount));

  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return next(
          ConflictError(ErrorCode.DUPLICATE_RESOURCE, "Unique constraint violated", {
            target: err.meta?.target,
          })
        );
      }
    }
    return next(
      err instanceof Error
        ? err
        : InternalServerError("Internal Server Error", { originalError: String(err) })
    );
  }
}

export async function getAccountsByCustomerId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { customerId } = (req as any).validated?.query as { customerId: string };
    const accounts = await accountService.fetchAccountsByCustomerId(BigInt(customerId));
    res.status(200).json(serializeAccounts(accounts));
  } catch (err) {
    return next(
      err instanceof Error
        ? err
        : InternalServerError("Internal Server Error", { originalError: String(err) })
    );
  }
}

export async function getAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = (req as any).validated?.params as { id: string };

    const account = await accountService.fetchAccountById(BigInt(id));

    if (!account) {
      throw NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found", { accountId: id });
    }

    res.status(200).json(serializeAccount(account));
  } catch (err) {
    return next(
      err instanceof Error
        ? err
        : InternalServerError("Internal Server Error", { originalError: String(err) })
    );
  }
}

export async function updateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = (req as any).validated.params as { id: string };
    const data = (req as any).validated.body as {nickname?: string;status?: AccountStatus;};

    const updated = await accountService.updateAccountById(BigInt(id), data);
    res.status(200).json(serializeAccount(updated));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return next(NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found", { accountId: req.params.id }));
    }

    return next(
      err instanceof Error
        ? err
        : InternalServerError("Internal Server Error", { originalError: String(err) })
    );
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = (req as any).validated.params as { id: string };

    const closed = await accountService.deleteAccountById(BigInt(id));
    res.status(200).json(serializeAccount(closed));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return next(NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found", { accountId: req.params.id }));
    }

    return next(
      err instanceof Error
        ? err
        : InternalServerError("Internal Server Error", { originalError: String(err) })
    );
  }
}
