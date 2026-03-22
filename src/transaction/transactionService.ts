import type { Transaction } from "../generated/client";
import type { AuthInput } from "../auth/user";
import prismaClient from "../db/prismaClient";
import { TransactionType } from "../generated/enums";
import { AppError } from "../error/error";
import { EventCode } from "../types/eventCodes";
import { serializeTransaction } from "./transactionUtils";
import { logger } from "../logging/logger";
import type {
  TransactionCreateInput,
  TransactionOutput,
  TransactionQueryInput,
} from "./transaction";
import {
  throwIfTransactionNotFound,
  throwIfTransactionNotOwned
} from "./transactionAssertions";
import {
  throwIfAccountNotActive,
  throwIfAccountNotFound,
  throwIfAccountNotOwned,
  throwIfInsufficientFunds
} from "../account/accountAssertions";
import {
  buildManyTransactionSuccessEvent,
  buildTransactionFailureEvent,
  buildTransactionSuccessEvent
} from "./transactionEventFactories";

export async function insertTransaction(
  accountId: string,
  data: TransactionCreateInput,
  authInput: AuthInput
): Promise<TransactionOutput> {
  const start = process.hrtime.bigint();

  try {
    const result = await prismaClient.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: accountId },
      });

      throwIfAccountNotFound(account);
      throwIfAccountNotOwned(account, authInput);
      throwIfAccountNotActive(account);

      if (data.type === TransactionType.DEBIT) {
        throwIfInsufficientFunds(account, data.amount, {
          current_balance: account.balance.toString(),
          requested_amount: data.amount,
        })
      }
      
      const transactionRecord: Transaction = await tx.transaction.create({
        data: {
          account_id: accountId,
          type: data.type,
          amount: data.amount,
          description: data.description ?? null,
          category: data.category ?? null,
        },
      });

      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: data.type === TransactionType.DEBIT
            ? account.balance.minus(data.amount)
            : account.balance.plus(data.amount)
        },
      });

      return transactionRecord;
    });

    logger.info(
      EventCode.TRANSACTION_CREATED,
      buildTransactionSuccessEvent(start, authInput, result)
    );

    return serializeTransaction(result);
  } catch (err) {
    if (err instanceof AppError) {
      logger.info(buildTransactionFailureEvent(
        start,
        authInput,
        err.code as EventCode,
        undefined,
        accountId
      ));
    }
    throw err;
  }
}


export async function fetchTransactions(
  accountId: string,
  query: TransactionQueryInput,
  authInput: AuthInput
): Promise<TransactionOutput[]> {
  const start = process.hrtime.bigint();

  try {
    const account = await prismaClient.account.findUnique({
      where: { id: accountId },
    });

    throwIfAccountNotFound(account);
    throwIfAccountNotOwned(account, authInput);

    const where: any = {
      account_id: accountId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.from) {
      where.created_at ??= {};
      where.created_at.gte = query.from;
    }

    if (query.to) {
      where.created_at ??= {};
      where.created_at.lte = query.to;
    }

    const transactionRecords = await prismaClient.transaction.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: query.limit,
      skip: query.offset,
    });

    logger.info(
      EventCode.TRANSACTION_FETCHED,
      buildManyTransactionSuccessEvent(
        start,
        authInput,
        accountId,
        transactionRecords.length
      )
    );

    return transactionRecords.map(serializeTransaction);
  } catch (err) {
    if (err instanceof AppError) {
      logger.info(buildTransactionFailureEvent(
        start,
        authInput,
        err.code as EventCode,
        undefined,
        accountId
      ));
    }
    throw err;
  }
}


export async function fetchTransactionById(
  transactionId: string,
  authInput: AuthInput
): Promise<TransactionOutput> {
  const start = process.hrtime.bigint();

  try {
    const transaction = await prismaClient.transaction.findUnique({
      where: { id: transactionId },
      include: { account: true },
    });

    throwIfTransactionNotFound(transaction);
    throwIfTransactionNotOwned(transaction, authInput);

    logger.info(
      EventCode.TRANSACTION_FETCHED,
      buildTransactionSuccessEvent(start, authInput, transaction)
    );

    return serializeTransaction(transaction);
  } catch (err) {
    if (err instanceof AppError) {
      logger.info(buildTransactionFailureEvent(
        start,
        authInput,
        err.code as EventCode,
        transactionId
      ));
    }
    throw err;
  }
}