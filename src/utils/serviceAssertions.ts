import { Decimal } from "@prisma/client/runtime/client";
import { AuthInput } from "../auth/user";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../error/error";
import { Account, AccountStatus, Transaction, Transfer, UserRole } from "../generated/client";
import { EventCode } from "../types/eventCodes";

export function throwIfAccountNotFound(
  account: Account | null
): asserts account is Account {
  if (!account) {
    throw NotFoundError(
      EventCode.ACCOUNT_NOT_FOUND,
      "Account not found"
    );
  }
}

export function throwIfTransactionNotFound(
  transaction: Transaction | null
): asserts transaction is Transaction {
  if (!transaction) {
    throw NotFoundError(
      EventCode.TRANSACTION_NOT_FOUND,
      "Transaction not found"
    );
  }
}

export function throwIfTransferNotFound(
  transfer: Transfer | null
): asserts transfer is Transfer {
  if (!transfer) {
    throw NotFoundError(
      EventCode.TRANSFER_NOT_FOUND,
      "Transfer not found"
    );
  }
}

export function throwIfNotAccountOwner(
  account: Account,
  authInput: AuthInput,
): void {
  if (
    authInput.role !== UserRole.ADMIN &&
    authInput.customerId !== account.customer_id
  ) {
    throw ForbiddenError(
      EventCode.FORBIDDEN,
      "Account not owned by caller"
    );
  }
}

export function throwIfNotTransactionOwner(
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
      "Transaction not owned by caller"
    );
  }
}

export function throwIfNotTransferOwner(
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
      "Transfer not owned by caller"
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
      "Self-transfers are not allowed"
    );
  }
}

export function throwIfAccountNotActive(
  account: Account,
): void {
  if (account.status !== AccountStatus.ACTIVE) {
    throw ConflictError(
      EventCode.ACCOUNT_NOT_ACTIVE,
      "Account is not active"
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
      "Insufficient funds",
      details
    );
  }
}