import { buildAccountRecord } from "../../accountMock";
import { buildTransferRecord } from "../../transferMock";
import { AccountStatus, UserRole } from "../../../src/generated/client";
import {
  throwIfAccountNotFound,
  throwIfTransferNotFound,
  throwIfAccountNotOwned,
  throwIfTransferNotOwned,
  throwIfSelfTransfer,
  throwIfAccountNotActive,
  throwIfInsufficientFunds,
  throwIfTransactionNotFound,
  throwIfTransactionNotOwned,
} from "../../../src/utils/serviceAssertions";
import { buildAuthInput } from "../../authMock";
import { mockAccountId1, mockAccountId2, mockCustomerId1, mockCustomerId2, mockMissingCustomerId } from "../../commonMock";
import { AppError, NotFoundError } from "../../../src/error/error";
import { EventCode } from "../../../src/types/eventCodes";
import { Decimal } from "@prisma/client/runtime/client";
import { buildTransactionRecord } from "../../transactionMock";
import { ErrorMessages } from "../../../src/error/errorMessages";

describe("throwIfAccountNotFound", () => {
  it("does not throw if account exists", () => {
    const account = buildAccountRecord();
    expect(() => throwIfAccountNotFound(account)).not.toThrow();
  });

  it("throws NotFoundError if account is null", () => {
    try {
      throwIfAccountNotFound(null);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appError = err as AppError;
      expect(appError.code).toBe(EventCode.ACCOUNT_NOT_FOUND);
      expect(appError.message).toBe(ErrorMessages.ACCOUNT_NOT_FOUND);
    }
  });
});

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

describe("throwIfTransferNotFound", () => {
  it("does not throw if transfer exists", () => {
    const transfer = buildTransferRecord();
    expect(() => throwIfTransferNotFound(transfer)).not.toThrow();
  });

  it("throws NotFoundError if transfer is null", () => {
    try {
      throwIfTransferNotFound(null);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appError = err as AppError;
      expect(appError.code).toBe(EventCode.TRANSFER_NOT_FOUND);
      expect(appError.message).toBe(ErrorMessages.TRANSFER_NOT_FOUND);
    }
  });
});

describe("throwIfNotAccountOwner", () => {
  it("does not throw if admin or owner", () => {
    const account = buildAccountRecord({
      customer_id: mockCustomerId1,
    });
    const authAdmin = buildAuthInput({
      role: UserRole.ADMIN,
      customerId: mockMissingCustomerId
    });
    const authOwner = buildAuthInput({
      customerId: mockCustomerId1,
    });

    expect(() => throwIfAccountNotOwned(account, authAdmin)).not.toThrow();
    expect(() => throwIfAccountNotOwned(account, authOwner)).not.toThrow();
  });

  it("throws ForbiddenError if neither owner or admin", () => {
    const account = buildAccountRecord();
    const authForbidden = buildAuthInput({
      customerId: mockMissingCustomerId,
    });

    try {
      throwIfAccountNotOwned(account, authForbidden);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appError = err as AppError;
      expect(appError.code).toBe(EventCode.FORBIDDEN);
      expect(appError.message).toBe(ErrorMessages.ACCOUNT_NOT_OWNED);
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

describe("throwIfNotTransferOwner", () => {
  it("does not throw if admin or owner", () => {
    const from_account = buildAccountRecord();
    const to_account = buildAccountRecord({
      id: mockAccountId1,
      customer_id: mockCustomerId2,
    });
    const transfer = {
      ...buildTransferRecord(),
      from_account: from_account,
      to_account: to_account,
    };
    const authAdmin = buildAuthInput({
      role: UserRole.ADMIN,
    });
    const authOwner = buildAuthInput({
      customerId: mockCustomerId1,
    });

    expect(() => throwIfTransferNotOwned(transfer, authAdmin)).not.toThrow();
    expect(() => throwIfTransferNotOwned(transfer, authOwner)).not.toThrow();
  });

  it("throws ForbiddenError if not owner and not admin", () => {
    const from_account = buildAccountRecord();
    const to_account = buildAccountRecord({
      id: mockAccountId1,
      customer_id: mockCustomerId2,
    });
    const transfer = {
      ...buildTransferRecord(),
      from_account: from_account,
      to_account: to_account,
    };
    const authForbidden = buildAuthInput({
      customerId: mockMissingCustomerId,
    });

    try {
      throwIfTransferNotOwned(transfer, authForbidden);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appError = err as AppError;
      expect(appError.code).toBe(EventCode.FORBIDDEN);
      expect(appError.message).toBe(ErrorMessages.TRANSFER_NOT_OWNED);
    }
  });
});

describe("throwIfSelfTransfer", () => {
  it("does not throw if source and destination accounts are different", () => {
    expect(() => throwIfSelfTransfer(mockAccountId1, mockAccountId2)).not.toThrow();
  });

  it("throws ConflictError if self transfer is attempted", () => {
    try {
      throwIfSelfTransfer(mockAccountId1, mockAccountId1);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appError = err as AppError;
      expect(appError.code).toBe(EventCode.NO_SELF_TRANSFER_ALLOWED);
      expect(appError.message).toBe(ErrorMessages.SELF_TRANSFER_NOT_ALLOWED);
    }
  });
});

describe("throwIfAccountNotActive", () => {
  it("does not throw if account is ACTIVE", () => {
    const account = buildAccountRecord();

    expect(() => throwIfAccountNotActive(account)).not.toThrow();
  });

  it("throws ConflictError if account is CLOSED", () => {
    const account = buildAccountRecord({
      status: AccountStatus.CLOSED
    });

    try {
      throwIfAccountNotActive(account);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appError = err as AppError;
      expect(appError.code).toBe(EventCode.ACCOUNT_NOT_ACTIVE);
      expect(appError.message).toBe(ErrorMessages.ACCOUNT_NOT_ACTIVE);
    }
  });
});

describe("throwIfInsufficientFunds", () => {
  it("does not throw if funds are sufficient", () => {
    const account = buildAccountRecord({
      balance: new Decimal(50),
    });
    const amount = new Decimal(1);

    expect(() => throwIfInsufficientFunds(account, amount)).not.toThrow();
  });

  it("throws ConflictError if funds are insufficient", () => {
    const account = buildAccountRecord();
    const amount = new Decimal(1);

    try {
      throwIfInsufficientFunds(account, amount);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appError = err as AppError;
      expect(appError.code).toBe(EventCode.INSUFFICIENT_FUNDS);
      expect(appError.message).toBe(ErrorMessages.INSUFFICIENT_FUNDS);
    }
  });
});
