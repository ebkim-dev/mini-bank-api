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
import { getDurationMs } from "../utils/calculateDuration";
import { buildSingleTransferSuccessEvent, buildTransactionFailureEvent, buildTransactionSuccessEvent } from "../logging/eventFactories";
import { logger } from "../logging/logger";
import { TransferCreateInput, TransferOutput } from "./transfer";

/*
POST /:accountId/transfers 
GET  /:accountId/transfers?limit=...&offset=... 
GET  /:accountId/transfers/:transferId 
*/

export async function insertTransfer(
  data: TransferCreateInput,
  authInput: AuthInput
): Promise<TransferOutput> {
  const start = process.hrtime.bigint();

  const transferResult = await prismaClient.$transaction(async (tx) => {
    const fromAccount = await tx.account.findUnique({
      where: { id: data.fromAccountId },
    });

    if (!fromAccount) {
      logger.info(
        EventCode.ACCOUNT_NOT_FOUND,
        // buildTransferFailureEvent(???)
      );
      throw NotFoundError(
        EventCode.ACCOUNT_NOT_FOUND,
        "Account not found",
        { account_id: data.fromAccountId }
      );
    }

    const toAccount = await tx.account.findUnique({
      where: { id: data.toAccountId },
    });

    if (!toAccount) {
      logger.info(
        EventCode.ACCOUNT_NOT_FOUND,
        // buildTransferFailureEvent(???)
      );
      throw NotFoundError(
        EventCode.ACCOUNT_NOT_FOUND,
        "Account not found",
        { account_id: data.toAccountId }
      );
    }

    if ( authInput.role !== UserRole.ADMIN
      && authInput.customerId !== fromAccount.customer_id ) {  
      const forbiddenErrorMessage = "Transfers can only be made by account owners";
      logger.info(
        EventCode.FORBIDDEN,
        // buildTransferFailureEvent(???)
      );
      throw ForbiddenError(EventCode.FORBIDDEN, forbiddenErrorMessage);
    }

    if (fromAccount.id === toAccount.id) {
      logger.info(
        EventCode.NO_SELF_TRANSFER_ALLOWED,
        // buildTransferFailureEvent(???)
      );
      throw ForbiddenError(
        EventCode.NO_SELF_TRANSFER_ALLOWED,
        "Self-transfers are not allowed"
      );
    }

    if ( fromAccount.status !== AccountStatus.ACTIVE
      || toAccount.status !== AccountStatus.ACTIVE ) {
      logger.info(
        EventCode.ACCOUNT_NOT_ACTIVE,
        // buildTransferFailureEvent(???)
      );
      throw ConflictError(
        EventCode.ACCOUNT_NOT_ACTIVE,
        "Account is not active"
      );
    }

    if (fromAccount.balance.lt(data.amount)) {
      throw ConflictError(
        EventCode.INSUFFICIENT_FUNDS,
        "Insufficient funds"
      );
    }

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
}


export async function fetchTransferById(
  id: string,
  authInput: AuthInput
): Promise<TransferOutput> {
  const start = process.hrtime.bigint();

  const transfer = await prismaClient.transfer.findUnique({
    where: { id },
    include: { from_account: true },
  });

  if (!transfer) {
    logger.info(
      EventCode.TRANSFER_NOT_FOUND,
      // buildTransferFailureEvent(???)
    );
    throw NotFoundError(
      EventCode.TRANSFER_NOT_FOUND,
      "Transfer not found",
      { transfer_id: id }
    );
  }

  if ( authInput.role !== UserRole.ADMIN
    && authInput.customerId !== transfer.from_account.customer_id ) {  
    const forbiddenErrorMessage = "Transfers can only be read by account owners";
    logger.info(
      EventCode.FORBIDDEN,
      // buildTransferFailureEvent(???)
    );
    throw ForbiddenError(EventCode.FORBIDDEN, forbiddenErrorMessage);
  }

  logger.info(
    EventCode.TRANSFER_FETCHED,
    buildSingleTransferSuccessEvent(start, authInput, transfer)
  );

  return serializeTransfer(transfer);
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