import type {
  TransactionCreateInput,
  TransactionOutput,
  TransactionQueryInput,
} from "./transaction";
import type { Transaction } from "../generated/client";
import type { AuthInput } from "../auth/user";
import prismaClient from "../db/prismaClient";
import { Decimal } from "@prisma/client/runtime/client";
import { AccountStatus, TransactionType, UserRole } from "../generated/enums";
import { ConflictError, ForbiddenError, NotFoundError } from "../error/error";
import { EventCode } from "../types/eventCodes";
import { serializeTransaction } from "./transactionUtils";
import { buildManyTransactionSuccessEvent, buildTransactionFailureEvent, buildTransactionSuccessEvent } from "../logging/eventFactories";
import { logger } from "../logging/logger";

export async function insertTransaction(
  accountId: string,
  data: TransactionCreateInput,
  authInput: AuthInput
): Promise<TransactionOutput> {
  const start = process.hrtime.bigint();

  const result = await prismaClient.$transaction(async (tx) => {
    // 1. Fetch the account and validate
    const account = await tx.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      logger.info(
        EventCode.ACCOUNT_NOT_FOUND,
        buildTransactionFailureEvent(
          start,
          authInput,
          EventCode.ACCOUNT_NOT_FOUND,
          undefined,
          accountId
        )
      );
      throw NotFoundError(
        EventCode.ACCOUNT_NOT_FOUND,
        "Account not found",
        { account_id: accountId }
      );
    }

    if (account.status !== AccountStatus.ACTIVE) {
      logger.info(
        EventCode.ACCOUNT_NOT_ACTIVE,
        buildTransactionFailureEvent(
          start,
          authInput,
          EventCode.ACCOUNT_NOT_ACTIVE,
          undefined,
          accountId
        )
      );
      throw ConflictError(
        EventCode.ACCOUNT_NOT_ACTIVE,
        "Account is not active",
        { account_id: accountId, status: account.status }
      );
    }

    // 2. Calculate new balance
    const amount = new Decimal(data.amount);
    let newBalance: Decimal;

    if (data.type === TransactionType.DEBIT) {
      newBalance = account.balance.minus(amount);
      if (newBalance.lessThan(0)) {
        logger.info(
          EventCode.INSUFFICIENT_FUNDS,
          buildTransactionFailureEvent(
            start,
            authInput,
            EventCode.INSUFFICIENT_FUNDS,
            undefined,
            accountId
          )
        );
        throw ConflictError(
          EventCode.INSUFFICIENT_FUNDS,
          "Insufficient funds",
          {
            account_id: accountId,
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
        account_id: accountId,
        type: data.type,
        amount,
        description: data.description ?? null,
        category: data.category ?? null,
      },
    });

    // 4. Update account balance
    await tx.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });

    return transactionRecord;
  });

  logger.info(
    EventCode.TRANSACTION_CREATED,
    buildTransactionSuccessEvent(start, authInput, result)
  );

  return serializeTransaction(result);
}


export async function fetchTransactions(
  accountId: string,
  query: TransactionQueryInput,
  authInput: AuthInput
): Promise<TransactionOutput[]> {
  const start = process.hrtime.bigint();

  const where: any = {
    account_id: accountId,
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

  const account = await prismaClient.account.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    logger.info(
      EventCode.ACCOUNT_NOT_FOUND,
      buildTransactionFailureEvent(
        start,
        authInput,
        EventCode.ACCOUNT_NOT_FOUND,
        undefined,
        accountId
      )
    );
    throw NotFoundError(EventCode.ACCOUNT_NOT_FOUND, "Account not found", {
      id: accountId,
    });
  }

  if (
    authInput.role !== UserRole.ADMIN &&
    authInput.customerId !== account.customer_id
  ) {
    logger.info(
      EventCode.FORBIDDEN,
      buildTransactionFailureEvent(
        start,
        authInput,
        EventCode.FORBIDDEN,
        undefined,
        accountId
      )
    );
    throw ForbiddenError(
      EventCode.FORBIDDEN,
      "Only account owners can read account transactions"
    );
  }

  const records: Transaction[] = await prismaClient.transaction.findMany({
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
    logger.info(
      EventCode.TRANSACTION_NOT_FOUND,
      buildTransactionFailureEvent(
        start,
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

  logger.info(
    EventCode.TRANSACTION_FETCHED,
    buildTransactionSuccessEvent(start, authInput, record)
  );

  return serializeTransaction(record);
}