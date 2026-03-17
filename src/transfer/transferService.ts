import type { AuthInput } from "../auth/user";
import prismaClient from "../db/prismaClient";
import { EventCode } from "../types/eventCodes";
import { logger } from "../logging/logger";
import { Transfer } from "../generated/client";
import { AppError } from "../error/error";
import { TransactionType } from "../generated/enums";
import { serializeTransfer } from "./transferUtils";
import {
  buildManyTransferSuccessEvent,
  buildSingleTransferSuccessEvent,
  buildTransferFailureEvent
} from "../logging/eventFactories";
import {
  TransferCreateInput,
  TransferOutput,
  TransferQueryInput
} from "./transfer";
import {
  throwIfAccountNotActive,
  throwIfAccountNotFound,
  throwIfNotAccountOwner,
  throwIfNotTransferOwner,
  throwIfInsufficientFunds,
  throwIfSelfTransfer,
  throwIfTransferNotFound,
} from "../utils/serviceAssertions"


export async function insertTransfer(
  data: TransferCreateInput,
  authInput: AuthInput
): Promise<TransferOutput> {
  const start = process.hrtime.bigint();

  try {
    const transferResult = await prismaClient.$transaction(async (tx) => {
      const fromAccount = await tx.account.findUnique({
        where: { id: data.fromAccountId },
      });

      throwIfAccountNotFound(fromAccount);
      throwIfNotAccountOwner(authInput, fromAccount);

      const toAccount = await tx.account.findUnique({
        where: { id: data.toAccountId },
      });

      throwIfAccountNotFound(toAccount);
      throwIfSelfTransfer(fromAccount, toAccount);
      throwIfAccountNotActive(fromAccount);
      throwIfAccountNotActive(toAccount);
      throwIfInsufficientFunds(fromAccount, data.amount);

      const transfer = await tx.transfer.create({
        data: {
          from_account_id: fromAccount.id,
          to_account_id: toAccount.id,
          amount: data.amount,
          memo: data.memo ?? null,
        },
      });

      await tx.account.update({
        where: { id: fromAccount.id },
        data: { balance: { decrement: data.amount } },
      });

      await tx.account.update({
        where: { id: toAccount.id },
        data: { balance: { increment: data.amount } },
      });
      
      await tx.transaction.create({
        data: {
          account_id: fromAccount.id,
          type: TransactionType.DEBIT,
          amount: data.amount,
          related_transfer_id: transfer.id,
        },
      });

      await tx.transaction.create({
        data: {
          account_id: toAccount.id,
          type: TransactionType.CREDIT,
          amount: data.amount,
          related_transfer_id: transfer.id,
        },
      });

      return transfer;
    });

    logger.info(
      EventCode.TRANSFER_CREATED,
      buildSingleTransferSuccessEvent(start, authInput, transferResult)
    );

    return serializeTransfer(transferResult);
  } catch (err) {
    if (err instanceof AppError) {
      logger.info(buildTransferFailureEvent(
        start,
        authInput,
        err.code as EventCode,
        data.fromAccountId,
        data.toAccountId,
        data.amount
      ));
    }
    throw err;
  }
}


export async function fetchTransferById(
  transferId: string,
  authInput: AuthInput
): Promise<TransferOutput> {
  const start = process.hrtime.bigint();

  try {
    const transfer = await prismaClient.transfer.findUnique({
      where: { id: transferId },
      include: { 
        from_account: true,
        to_account: true
      },
    });

    throwIfTransferNotFound(transfer);
    throwIfNotTransferOwner(authInput, transfer);

    logger.info(
      EventCode.TRANSFER_FETCHED,
      buildSingleTransferSuccessEvent(
        start, authInput, transfer
      )
    );

    return serializeTransfer(transfer);
  } catch (err) {
    if (err instanceof AppError) {
      logger.info(buildTransferFailureEvent(
        start,
        authInput,
        err.code as EventCode,
        transferId
      ));
    }
    throw err;
  }
}


export async function fetchTransfers(
  accountId: string,
  query: TransferQueryInput,
  authInput: AuthInput
): Promise<TransferOutput[]> {
  const start = process.hrtime.bigint();

  try {
    const account = await prismaClient.account.findUnique({
      where: { id: accountId },
    });

    throwIfAccountNotFound(account);
    throwIfNotAccountOwner(authInput, account);

    const where: any = {
      OR: [
        { from_account_id: accountId },
        { to_account_id: accountId }
      ]
    };

    if (query.from) {
      where.created_at ??= {};
      where.created_at.gte = new Date(query.from);
    }

    if (query.to) {
      where.created_at ??= {};
      where.created_at.lte = new Date(query.to);
    }

    const transferRecords: Transfer[] = await prismaClient.transfer.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: query.limit,
      skip: query.offset,
    });

    logger.info(
      EventCode.TRANSFER_FETCHED,
      buildManyTransferSuccessEvent(
        start, authInput, transferRecords
      )
    );

    return transferRecords.map(serializeTransfer);
  } catch (err) {
    if (err instanceof AppError) {
      logger.info(buildTransferFailureEvent(
        start,
        authInput,
        err.code as EventCode,
        accountId
      ));
    }
    throw err;
  }
}