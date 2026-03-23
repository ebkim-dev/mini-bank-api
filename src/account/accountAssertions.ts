import { AuthInput } from "../auth/user";
import { EventCode } from "../types/eventCodes";
import { ErrorMessages } from "../error/errorMessages";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../error/error";
import {
  Account,
  AccountStatus,
  UserRole
} from "../generated/client";
import { Decimal } from "@prisma/client/runtime/client";

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