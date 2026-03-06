import type {
  TransactionCreateInput,
  TransactionOutput,
  TransactionQueryInput,
} from "./transaction";
import type { Transaction } from "../generated/client";
import type { AuthInput } from "../auth/user";
import prismaClient from "../db/prismaClient";
import { Decimal } from "@prisma/client/runtime/client";
import { AccountStatus, TransactionType } from "../generated/enums";
import { ConflictError, NotFoundError } from "../error/error";
import { EventCode } from "../types/eventCodes";
import { serializeTransaction } from "./transactionUtils";
import { getDurationMs } from "../utils/calculateDuration";
import {
  logEvent,
  mapToManyTransactionSuccessEvent,
  mapToTransactionFailureEvent,
  mapToTransactionSuccessEvent,
} from "../logging/logSchemas";

export async function insertTransaction(
  data: TransactionCreateInput,
  authInput: AuthInput
): Promise<TransactionOutput> {
  const start = process.hrtime.bigint();

  const result = await prismaClient.$transaction(async (tx) => {
    // 1. Fetch the account and validate
    const account = await tx.account.findUnique({
      where: { id: data.account_id },
    });

    if (!account) {
      throw NotFoundError(
        EventCode.ACCOUNT_NOT_FOUND,
        "Account not found",
        { account_id: data.account_id }
      );
    }

    if (account.status !== AccountStatus.ACTIVE) {
      throw ConflictError(
        EventCode.ACCOUNT_NOT_ACTIVE,
        "Account is not active",
        { account_id: data.account_id, status: account.status }
      );
    }

    // 2. Calculate new balance
    const amount = new Decimal(data.amount);
    let newBalance: Decimal;

    if (data.type === TransactionType.DEBIT) {
      newBalance = account.balance.minus(amount);
      if (newBalance.lessThan(0)) {
        throw ConflictError(
          EventCode.INSUFFICIENT_FUNDS,
          "Insufficient funds",
          {
            account_id: data.account_id,
            current_balance: account.balance.toString(),
            requested_amount: data.amount,
          }
        );
      }
    } else {
      newBalance = account.balance.plus(amount);
    }

    // 3. Create transaction record
    const transactionRecord: Transaction = await tx.transaction.create({
      data: {
        account_id: data.account_id,
        type: data.type,
        amount,
        description: data.description ?? null,
        category: data.category ?? null,
      },
    });

    // 4. Update account balance
    await tx.account.update({
      where: { id: data.account_id },
      data: { balance: newBalance },
    });

    return transactionRecord;
  });

  logEvent(
    EventCode.TRANSACTION_CREATED,
    mapToTransactionSuccessEvent(getDurationMs(start), authInput, result)
  );

  return serializeTransaction(result);
}

export async function fetchTransactions(
  query: TransactionQueryInput,
  authInput: AuthInput
): Promise<TransactionOutput[]> {
  const start = process.hrtime.bigint();

  const where: any = {
    account_id: query.account_id,
  };

  if (query.type) {
    where.type = query.type;
  }

  if (query.from || query.to) {
    where.created_at = {};
    if (query.from) {
      where.created_at.gte = new Date(query.from);
    }
    if (query.to) {
      where.created_at.lte = new Date(query.to);
    }
  }

  const records: Transaction[] = await prismaClient.transaction.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: query.limit,
    skip: query.offset,
  });

  logEvent(
    EventCode.TRANSACTION_FETCHED,
    mapToManyTransactionSuccessEvent(
      getDurationMs(start),
      authInput,
      query.account_id,
      records.length
    )
  );

  return records.map(serializeTransaction);
}

export async function fetchTransactionById(
  id: string,
  authInput: AuthInput
): Promise<TransactionOutput> {
  const start = process.hrtime.bigint();

  const record: Transaction | null =
    await prismaClient.transaction.findUnique({ where: { id } });

  if (!record) {
    logEvent(
      EventCode.TRANSACTION_NOT_FOUND,
      mapToTransactionFailureEvent(
        getDurationMs(start),
        authInput,
        EventCode.TRANSACTION_NOT_FOUND,
        id
      )
    );

    throw NotFoundError(
      EventCode.TRANSACTION_NOT_FOUND,
      "Transaction not found",
      { id }
    );
  }

  logEvent(
    EventCode.TRANSACTION_FETCHED,
    mapToTransactionSuccessEvent(getDurationMs(start), authInput, record)
  );


  return serializeTransaction(record);
}