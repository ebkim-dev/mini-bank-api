import { buildAccountRecord } from "../../accountMock";
import { buildTransferRecord } from "../../transferMock";
import { AccountStatus, UserRole } from "../../../src/generated/client";
import { buildAuthInput } from "../../authMock";
import { AppError } from "../../../src/error/error";
import { EventCode } from "../../../src/types/eventCodes";
import { ErrorMessages } from "../../../src/error/errorMessages";
import {
  mockAccountId1,
  mockAccountId2,
  mockCustomerId1,
  mockCustomerId2,
  mockMissingCustomerId
} from "../../commonMock";
import {
  throwIfSelfTransfer,
  throwIfTransferNotFound,
  throwIfTransferNotOwned,
} from "../../../src/transfer/transferAssertions";

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
      expect(appError.message).toBe(ErrorMessages.NO_SELF_TRANSFER_ALLOWED);
    }
  });
});
