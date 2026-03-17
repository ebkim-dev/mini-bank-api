import * as transferService from "../../../src/transfer/transferService";
import prismaClient from '../../../src/db/prismaClient';
import { buildAuthInput } from '../../authMock';
import { buildTransactionRecord, mockTransactionId2 } from "../../transactionMock";
import { Decimal } from "@prisma/client/runtime/client";
import { ConflictError, ForbiddenError, NotFoundError } from "../../../src/error/error";
import { EventCode } from "../../../src/types/eventCodes";
import { logger } from "../../../src/logging/logger";
import { 
  throwIfAccountNotActive,
  throwIfAccountNotFound,
  throwIfInsufficientFunds,
  throwIfNotAccountOwner,
  throwIfSelfTransfer
} from "../../../src/utils/serviceAssertions";
import { 
  buildTransferCreateInput,
  buildTransferOutput,
  buildTransferRecord
} from "../../transferMock";
import { 
  TransactionType,
} from "../../../src/generated/enums";
import { 
  mockAccountId2,
  mockCustomerId2,
} from "../../commonMock";
import { 
  buildAccountRecord,
} from '../../accountMock';

const mockTx = {
  account: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  transfer: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
  },
};

(prismaClient.$transaction as jest.Mock).mockImplementation(cb => cb(mockTx));

const guardMocks = {
  throwIfAccountNotFound: throwIfAccountNotFound as jest.Mock,
  throwIfNotAccountOwner: throwIfNotAccountOwner as jest.Mock,
  throwIfSelfTransfer: throwIfSelfTransfer as jest.Mock,
  throwIfAccountNotActive: throwIfAccountNotActive as jest.Mock,
  throwIfInsufficientFunds: throwIfInsufficientFunds as jest.Mock,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockTx.account.findUnique
    .mockResolvedValueOnce(buildAccountRecord({
      balance: new Decimal(1000)
    }))
    .mockResolvedValueOnce(buildAccountRecord({
      id: mockAccountId2,
      customer_id: mockCustomerId2,
    }));

  mockTx.transfer.create
    .mockResolvedValueOnce(buildTransferRecord());

  mockTx.account.update
    .mockResolvedValueOnce(buildAccountRecord({
      balance: new Decimal(950)
    }))
    .mockResolvedValueOnce(buildAccountRecord({
      id: mockAccountId2,
      customer_id: mockCustomerId2,
      balance: new Decimal(50)
    }));

  mockTx.transaction.create
    .mockResolvedValueOnce(buildTransactionRecord({
      type: TransactionType.DEBIT,
    }))
    .mockResolvedValueOnce(buildTransactionRecord({
      id: mockTransactionId2,
      account_id: mockAccountId2,
    }));

  Object.values(guardMocks).forEach(mockFn => {
    mockFn.mockImplementation(() => {});
  });

  jest.spyOn(logger, "info").mockReturnValue(logger);
});


describe("insertTransfer service", () => {
  it("should return new transfer record given valid inputs", async () => {
    await expect(transferService.insertTransfer(
      buildTransferCreateInput(),
      buildAuthInput()
    )).resolves.toMatchObject(buildTransferOutput());

    expect(throwIfAccountNotFound).toHaveBeenCalledTimes(2);
    expect(throwIfNotAccountOwner).toHaveBeenCalledTimes(1);
    expect(throwIfSelfTransfer).toHaveBeenCalledTimes(1);
    expect(throwIfAccountNotActive).toHaveBeenCalledTimes(2);
    expect(throwIfInsufficientFunds).toHaveBeenCalledTimes(1);

    expect(mockTx.account.findUnique).toHaveBeenCalledTimes(2);
    expect(mockTx.transfer.create).toHaveBeenCalledTimes(1);
    expect(mockTx.account.update).toHaveBeenCalledTimes(2);
    expect(mockTx.transaction.create).toHaveBeenCalledTimes(2);

    expect(logger.info).toHaveBeenCalledWith(
      EventCode.TRANSFER_CREATED,
      expect.any(Object)
    );
  });

  it("should throw 404 if source account is not found", async () => {
    (throwIfAccountNotFound as jest.Mock).mockImplementation(() => {
      throw NotFoundError(
        EventCode.ACCOUNT_NOT_FOUND,
        "Account not found"
      )
    });

    await expect(transferService.insertTransfer(
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.ACCOUNT_NOT_FOUND
    });

    expect(throwIfAccountNotFound).toHaveBeenCalledTimes(1);

    expect(mockTx.account.findUnique).toHaveBeenCalledTimes(1);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 403 if account ownership check fails", async () => {
    (throwIfNotAccountOwner as jest.Mock).mockImplementation(() => {
      throw ForbiddenError(
        EventCode.FORBIDDEN,
        "Transfers can only be made by account owners"
      )
    });

    await expect(transferService.insertTransfer(
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.FORBIDDEN
    });

    expect(throwIfAccountNotFound).toHaveBeenCalledTimes(1);
    expect(throwIfNotAccountOwner).toHaveBeenCalledTimes(1);

    expect(mockTx.account.findUnique).toHaveBeenCalledTimes(1);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 404 if destination account is not found", async () => {
    (throwIfAccountNotFound as jest.Mock).mockImplementation(() => {
      throw NotFoundError(
        EventCode.ACCOUNT_NOT_FOUND,
        "Account not found"
      )
    });

    await expect(transferService.insertTransfer(
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.ACCOUNT_NOT_FOUND
    });

    expect(throwIfAccountNotFound).toHaveBeenCalledTimes(2);
    expect(throwIfNotAccountOwner).toHaveBeenCalledTimes(1);

    expect(mockTx.account.findUnique).toHaveBeenCalledTimes(2);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 409 if self transfer is attempted", async () => {
    (throwIfSelfTransfer as jest.Mock).mockImplementation(() => {
      throw ConflictError(
        EventCode.NO_SELF_TRANSFER_ALLOWED,
        "Self-transfers are not allowed"
      )
    });

    await expect(transferService.insertTransfer(
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.NO_SELF_TRANSFER_ALLOWED
    });

    expect(throwIfAccountNotFound).toHaveBeenCalledTimes(2);
    expect(throwIfNotAccountOwner).toHaveBeenCalledTimes(1);
    expect(throwIfSelfTransfer).toHaveBeenCalledTimes(1);

    expect(mockTx.account.findUnique).toHaveBeenCalledTimes(2);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 409 if source account is not active", async () => {
    (throwIfAccountNotActive as jest.Mock).mockImplementation(() => {
      throw ConflictError(
        EventCode.ACCOUNT_NOT_ACTIVE,
        "Account is not active"
      )
    });

    await expect(transferService.insertTransfer(
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.ACCOUNT_NOT_ACTIVE
    });

    expect(throwIfAccountNotFound).toHaveBeenCalledTimes(2);
    expect(throwIfNotAccountOwner).toHaveBeenCalledTimes(1);
    expect(throwIfSelfTransfer).toHaveBeenCalledTimes(1);
    expect(throwIfAccountNotActive).toHaveBeenCalledTimes(1);

    expect(mockTx.account.findUnique).toHaveBeenCalledTimes(2);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 409 if destination account is not active", async () => {
    (throwIfAccountNotActive as jest.Mock).mockImplementation(() => {
      throw ConflictError(
        EventCode.ACCOUNT_NOT_ACTIVE,
        "Account is not active"
      )
    });

    await expect(transferService.insertTransfer(
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.ACCOUNT_NOT_ACTIVE
    });

    expect(throwIfAccountNotFound).toHaveBeenCalledTimes(2);
    expect(throwIfNotAccountOwner).toHaveBeenCalledTimes(1);
    expect(throwIfSelfTransfer).toHaveBeenCalledTimes(1);
    expect(throwIfAccountNotActive).toHaveBeenCalledTimes(2);

    expect(mockTx.account.findUnique).toHaveBeenCalledTimes(2);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 409 if source account is out of funds", async () => {
    (throwIfInsufficientFunds as jest.Mock).mockImplementation(() => {
      throw ConflictError(
        EventCode.INSUFFICIENT_FUNDS,
        "Insufficient funds"
      )
    });

    await expect(transferService.insertTransfer(
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.INSUFFICIENT_FUNDS
    });

    expect(throwIfAccountNotFound).toHaveBeenCalledTimes(2);
    expect(throwIfNotAccountOwner).toHaveBeenCalledTimes(1);
    expect(throwIfSelfTransfer).toHaveBeenCalledTimes(1);
    expect(throwIfAccountNotActive).toHaveBeenCalledTimes(2);
    expect(throwIfInsufficientFunds).toHaveBeenCalledTimes(1);

    expect(mockTx.account.findUnique).toHaveBeenCalledTimes(2);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });
});

