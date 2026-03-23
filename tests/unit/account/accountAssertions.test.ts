import { buildAccountRecord } from "../../accountMock";
import { AccountStatus, UserRole } from "../../../src/generated/client";
import { buildAuthInput } from "../../authMock";
import { AppError } from "../../../src/error/error";
import { EventCode } from "../../../src/types/eventCodes";
import { Decimal } from "@prisma/client/runtime/client";
import { ErrorMessages } from "../../../src/error/errorMessages";
import {
  mockCustomerId1,
  mockMissingCustomerId
} from "../../commonMock";
import {
  throwIfAccountNotActive,
  throwIfAccountNotFound,
  throwIfAccountNotOwned,
  throwIfInsufficientFunds,
} from "../../../src/account/accountAssertions";


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
