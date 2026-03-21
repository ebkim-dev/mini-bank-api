import { Decimal } from "@prisma/client/runtime/client";
import { AuthInput } from "../auth/user";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../error/error";
import { Account, AccountStatus, Transaction, Transfer, UserRole } from "../generated/client";
import { EventCode } from "../types/eventCodes";
import { ErrorMessages } from "../error/errorMessages";

export function throwIfAccountNotFound(
  account: Account | null
): asserts account is Account {
  if (!account) {
    throw NotFoundError(
      EventCode.ACCOUNT_NOT_FOUND,
      ErrorMessages.ACCOUNT_NOT_FOUND,
    );
  }
}

export function throwIfTransactionNotFound(
  transaction: Transaction | null
): asserts transaction is Transaction {
  if (!transaction) {
    throw NotFoundError(
      EventCode.TRANSACTION_NOT_FOUND,
      ErrorMessages.TRANSACTION_NOT_FOUND,
    );
  }
}

export function throwIfTransferNotFound(
  transfer: Transfer | null
): asserts transfer is Transfer {
  if (!transfer) {
    throw NotFoundError(
      EventCode.TRANSFER_NOT_FOUND,
      ErrorMessages.TRANSFER_NOT_FOUND,
    );
  }
}

export function throwIfAccountNotOwned(
  account: Account,
  authInput: AuthInput,
): void {
  if (
    authInput.role !== UserRole.ADMIN &&
    authInput.customerId !== account.customer_id
  ) {
    throw ForbiddenError(
      EventCode.FORBIDDEN,
      ErrorMessages.ACCOUNT_NOT_OWNED,
    );
  }
}

export function throwIfTransactionNotOwned(
  transaction: Transaction & {
    account: Account,
  },
  authInput: AuthInput,
): void {
  if (
    authInput.role !== UserRole.ADMIN &&
    authInput.customerId !== transaction.account.customer_id
  ) {
    throw ForbiddenError(
      EventCode.FORBIDDEN,
      ErrorMessages.TRANSACTION_NOT_OWNED,
    );
  }
}

export function throwIfTransferNotOwned(
  transfer: Transfer & {
    from_account: Account,
    to_account: Account,
  },
  authInput: AuthInput,
): void {
  if (
    authInput.role !== UserRole.ADMIN &&
    authInput.customerId !== transfer.from_account.customer_id &&
    authInput.customerId !== transfer.to_account.customer_id
  ) {
    throw ForbiddenError(
      EventCode.FORBIDDEN,
      ErrorMessages.TRANSFER_NOT_OWNED,
    );
  }
}

export function throwIfSelfTransfer(
  fromAccountId: string,
  toAccountId: string,
): void {
  if (fromAccountId === toAccountId) {
    throw BadRequestError(
      EventCode.NO_SELF_TRANSFER_ALLOWED,
      ErrorMessages.SELF_TRANSFER_NOT_ALLOWED,
    );
  }
}

export function throwIfAccountNotActive(
  account: Account,
): void {
  if (account.status !== AccountStatus.ACTIVE) {
    throw ConflictError(
      EventCode.ACCOUNT_NOT_ACTIVE,
      ErrorMessages.ACCOUNT_NOT_ACTIVE,
    );
  }
}

export function throwIfInsufficientFunds(
  account: Account,
  amount: Decimal,
  details?: unknown,
): void {
  if (account.balance.lt(amount)) {
    throw ConflictError(
      EventCode.INSUFFICIENT_FUNDS,
      ErrorMessages.INSUFFICIENT_FUNDS,
      details
    );
  }
}