import { AuthInput } from "../auth/user";
import { EventCode } from "../types/eventCodes";
import { ErrorMessages } from "../error/errorMessages";
import {
  ForbiddenError,
  NotFoundError,
} from "../error/error";
import {
  Account,
  Transaction,
  UserRole
} from "../generated/client";

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
