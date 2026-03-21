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
  throwIfAccountNotOwned,
  throwIfTransferNotOwned,
  throwIfInsufficientFunds,
  throwIfSelfTransfer,
  throwIfTransferNotFound,
} from "../utils/serviceAssertions"


export async function insertTransfer(
  fromAccountId: string,
  data: TransferCreateInput,
  authInput: AuthInput
): Promise<TransferOutput> {
  const start = process.hrtime.bigint();

  try {
    throwIfSelfTransfer(fromAccountId, data.toAccountId);
    
    const transferResult = await prismaClient.$transaction(async (tx) => {
      const fromAccount = await tx.account.findUnique({
        where: { id: fromAccountId },
      });

      throwIfAccountNotFound(fromAccount);
      throwIfAccountNotOwned(fromAccount, authInput);
      throwIfAccountNotActive(fromAccount);
      throwIfInsufficientFunds(fromAccount, data.amount, {
        current_balance: fromAccount.balance.toString(),
        requested_amount: data.amount.toString()
      });

      const toAccount = await tx.account.findUnique({
        where: { id: data.toAccountId },
      });

      throwIfAccountNotFound(toAccount);
      throwIfAccountNotActive(toAccount);

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
        fromAccountId,
        data.toAccountId,
        data.amount
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
    throwIfAccountNotOwned(account, authInput);

    const where: any = {
      OR: [
        { from_account_id: accountId },
        { to_account_id: accountId }
      ]
    };

    if (query.from) {
      where.created_at ??= {};
      where.created_at.gte = query.from;
    }

    if (query.to) {
      where.created_at ??= {};
      where.created_at.lte = query.to;
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
    throwIfTransferNotOwned(transfer, authInput);

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