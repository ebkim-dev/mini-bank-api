import { buildAccountRecord } from "../../accountMock";
import { UserRole } from "../../../src/generated/client";
import { buildAuthInput } from "../../authMock";
import { AppError } from "../../../src/error/error";
import { EventCode } from "../../../src/types/eventCodes";
import { buildTransactionRecord } from "../../transactionMock";
import { ErrorMessages } from "../../../src/error/errorMessages";
import {
  mockCustomerId1,
  mockMissingCustomerId
} from "../../commonMock";
import {
  throwIfTransactionNotOwned,
  throwIfTransactionNotFound,
} from "../../../src/transaction/transactionAssertions";

describe("throwIfTransactionNotFound", () => {
  it("does not throw if transaction exists", () => {
    const transaction = buildTransactionRecord();
    expect(() => throwIfTransactionNotFound(transaction)).not.toThrow();
  });

  it("throws NotFoundError if transaction is null", () => {
    try {
      throwIfTransactionNotFound(null);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appError = err as AppError;
      expect(appError.code).toBe(EventCode.TRANSACTION_NOT_FOUND);
      expect(appError.message).toBe(ErrorMessages.TRANSACTION_NOT_FOUND);
    }
  });
});

describe("throwIfNotTransactionOwner", () => {
  it("does not throw if admin or owner", () => {
    const account = buildAccountRecord();
    const transaction = {
      ...buildTransactionRecord(),
      account: account,
    };
    const authAdmin = buildAuthInput({
      role: UserRole.ADMIN,
    });
    const authOwner = buildAuthInput({
      customerId: mockCustomerId1,
    });

    expect(() => throwIfTransactionNotOwned(transaction, authAdmin)).not.toThrow();
    expect(() => throwIfTransactionNotOwned(transaction, authOwner)).not.toThrow();
  });

  it("throws ForbiddenError if not owner and not admin", () => {
    const account = buildAccountRecord();
    const transaction = {
      ...buildTransactionRecord(),
      account: account,
    };
    const authForbidden = buildAuthInput({
      customerId: mockMissingCustomerId,
    });

    try {
      throwIfTransactionNotOwned(transaction, authForbidden);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appError = err as AppError;
      expect(appError.code).toBe(EventCode.FORBIDDEN);
      expect(appError.message).toBe(ErrorMessages.TRANSACTION_NOT_OWNED);
    }
  });
});
