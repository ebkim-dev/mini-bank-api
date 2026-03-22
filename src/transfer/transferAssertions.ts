import { AuthInput } from "../auth/user";
import { EventCode } from "../types/eventCodes";
import { ErrorMessages } from "../error/errorMessages";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../error/error";
import {
  Account,
  Transfer,
  UserRole
} from "../generated/client";

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
      ErrorMessages.NO_SELF_TRANSFER_ALLOWED,
    );
  }
}