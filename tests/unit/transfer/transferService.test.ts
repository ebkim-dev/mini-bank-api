import * as transferService from "../../../src/transfer/transferService";
import { buildAuthInput } from '../../authMock';
import { buildTransactionRecord, mockTransactionId2 } from "../../transactionMock";
import { Decimal } from "@prisma/client/runtime/client";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../../src/error/error";
import { EventCode } from "../../../src/types/eventCodes";
import { logger } from "../../../src/logging/logger";
import * as serviceAssertions from "../../../src/utils/serviceAssertions";
import { 
  throwIfAccountNotActive,
  throwIfAccountNotFound,
  throwIfInsufficientFunds,
  throwIfNotAccountOwner,
  throwIfNotTransferOwner,
  throwIfSelfTransfer,
  throwIfTransferNotFound
} from "../../../src/utils/serviceAssertions";
import { 
  buildTransferCreateInput,
  buildTransferOutput,
  buildTransferQueryInput,
  buildTransferRecord
} from "../../transferMock";
import { 
  TransactionType,
} from "../../../src/generated/enums";
import { 
  mockAccountId1,
  mockAccountId2,
  mockCustomerId2,
  mockMissingAccountId,
  mockMissingCustomerId,
  mockMissingTransferId,
  mockTransferId1,
  mockTransferId2,
} from "../../commonMock";
import { 
  buildAccountRecord,
} from '../../accountMock';

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    transfer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    }
  }
}));
import prismaClient from "../../../src/db/prismaClient";

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(logger, "info").mockReturnValue(logger);
});


describe("insertTransfer service", () => {
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

  const mockTransaction = prismaClient.$transaction as jest.Mock;

  beforeEach(() => {
    mockTransaction.mockImplementation(cb => cb(mockTx));

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

    jest.spyOn(serviceAssertions, "throwIfAccountNotFound").mockImplementation(() => {});
    jest.spyOn(serviceAssertions, "throwIfNotAccountOwner").mockImplementation(() => {});
    jest.spyOn(serviceAssertions, "throwIfSelfTransfer").mockImplementation(() => {});
    jest.spyOn(serviceAssertions, "throwIfAccountNotActive").mockImplementation(() => {});
    jest.spyOn(serviceAssertions, "throwIfInsufficientFunds").mockImplementation(() => {});
  });

  it("should return new transfer record given valid inputs", async () => {
    await expect(transferService.insertTransfer(
      mockAccountId1,
      buildTransferCreateInput(),
      buildAuthInput()
    )).resolves.toMatchObject(buildTransferOutput());

    expect(mockTx.account.findUnique).toHaveBeenCalled();
    expect(mockTx.transfer.create).toHaveBeenCalled();
    expect(mockTx.account.update).toHaveBeenCalled();
    expect(mockTx.transaction.create).toHaveBeenCalled();

    expect(logger.info).toHaveBeenCalledWith(
      EventCode.TRANSFER_CREATED,
      expect.any(Object)
    );
  });

  it("should throw 400 if self transfer is attempted", async () => {
    (throwIfSelfTransfer as jest.Mock).mockImplementation(() => {
      throw BadRequestError(
        EventCode.NO_SELF_TRANSFER_ALLOWED,
        "Self-transfers are not allowed"
      )
    });

    await expect(transferService.insertTransfer(
      mockAccountId1,
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.NO_SELF_TRANSFER_ALLOWED
    });

    expect(mockTx.account.findUnique).not.toHaveBeenCalled();
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 404 if source account is not found", async () => {
    (throwIfAccountNotFound as jest.Mock).mockImplementation(() => {
      throw NotFoundError(
        EventCode.ACCOUNT_NOT_FOUND,
        "Account not found"
      )
    });

    await expect(transferService.insertTransfer(
      mockAccountId1,
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.ACCOUNT_NOT_FOUND
    });

    expect(mockTx.account.findUnique).toHaveBeenCalled();
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
      mockAccountId1,
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.FORBIDDEN
    });

    expect(mockTx.account.findUnique).toHaveBeenCalled();
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 403 if source account is not active", async () => {
    (throwIfAccountNotActive as jest.Mock).mockImplementation(() => {
      throw ForbiddenError(
        EventCode.ACCOUNT_NOT_ACTIVE,
        "Account is not active"
      )
    });

    await expect(transferService.insertTransfer(
      mockAccountId1,
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.ACCOUNT_NOT_ACTIVE
    });

    expect(mockTx.account.findUnique).toHaveBeenCalled();
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 400 if source account is out of funds", async () => {
    (throwIfInsufficientFunds as jest.Mock).mockImplementation(() => {
      throw BadRequestError(
        EventCode.INSUFFICIENT_FUNDS,
        "Insufficient funds"
      )
    });

    await expect(transferService.insertTransfer(
      mockAccountId1,
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.INSUFFICIENT_FUNDS
    });

    expect(mockTx.account.findUnique).toHaveBeenCalled();
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
      mockAccountId1,
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.ACCOUNT_NOT_FOUND
    });

    expect(mockTx.account.findUnique).toHaveBeenCalled();
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 403 if destination account is not active", async () => {
    (throwIfAccountNotActive as jest.Mock).mockImplementation(() => {
      throw ForbiddenError(
        EventCode.ACCOUNT_NOT_ACTIVE,
        "Account is not active"
      )
    });

    await expect(transferService.insertTransfer(
      mockAccountId1,
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.ACCOUNT_NOT_ACTIVE
    });

    expect(mockTx.account.findUnique).toHaveBeenCalled();
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });
});


describe("fetchTransferById service", () => {
  const mockFindUnique = prismaClient.transfer.findUnique as jest.Mock;

  beforeEach(() => {
    mockFindUnique.mockResolvedValueOnce(buildTransferRecord());

    jest.spyOn(serviceAssertions, "throwIfTransferNotFound").mockImplementation(() => {});
    jest.spyOn(serviceAssertions, "throwIfNotTransferOwner").mockImplementation(() => {});
  });

  it("should return transfer given correct input", async () => {
    await expect(transferService.fetchTransferById(
      mockTransferId1,
      buildAuthInput()
    )).resolves.toMatchObject(buildTransferOutput());

    expect(mockFindUnique).toHaveBeenCalled();

    expect(logger.info).toHaveBeenCalledWith(
      EventCode.TRANSFER_FETCHED,
      expect.any(Object)
    );
  })

  it("should throw 404 if transfer is not found", async () => {
    (throwIfTransferNotFound as jest.Mock).mockImplementation(() => {
      throw NotFoundError(
        EventCode.TRANSFER_NOT_FOUND,
        "Transfer not found"
      )
    });

    await expect(transferService.fetchTransferById(
      mockMissingTransferId,
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.TRANSFER_NOT_FOUND
    });

    expect(mockFindUnique).toHaveBeenCalled();
  });

  it("should throw 403 if caller is not transfer owner", async () => {
    (throwIfNotTransferOwner as jest.Mock).mockImplementation(() => {
      throw ForbiddenError(
        EventCode.FORBIDDEN,
        "Transfers can only be read by account owners"
      )
    });

    await expect(transferService.fetchTransferById(
      mockTransferId1,
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.FORBIDDEN
    });

    expect(mockFindUnique).toHaveBeenCalled();
  });

  it("should throw 500 if prisma throws", async () => {
    mockFindUnique.mockReset();
    mockFindUnique.mockRejectedValue(new Error("DB failure"));

    await expect(transferService.fetchTransferById(
      mockTransferId1,
      buildAuthInput()
    )).rejects.toThrow();

    expect(mockFindUnique).toHaveBeenCalled();
  });
});


describe("fetchTransfers service", () => {
  const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
  const mockFindMany = prismaClient.transfer.findMany as jest.Mock;

  beforeEach(() => {
    mockFindUnique.mockResolvedValueOnce(buildAccountRecord());
    mockFindMany.mockResolvedValueOnce([
      buildTransferRecord(),
      buildTransferRecord({ id: mockTransferId2 })
    ]);

    jest.spyOn(serviceAssertions, "throwIfAccountNotFound").mockImplementation(() => {});
    jest.spyOn(serviceAssertions, "throwIfNotAccountOwner").mockImplementation(() => {});
  });

  it("should return list of transfers given populated query", async () => {
    await expect(transferService.fetchTransfers(
      mockAccountId1,
      buildTransferQueryInput(),
      buildAuthInput()
    )).resolves.toMatchObject([
      buildTransferOutput(),
      buildTransferOutput({ id: mockTransferId2 }),
    ]);

    expect(mockFindMany).toHaveBeenCalled();

    expect(logger.info).toHaveBeenCalledWith(
      EventCode.TRANSFER_FETCHED,
      expect.any(Object)
    );
  });

  it("should throw 404 if owner account is not found", async () => {
    (throwIfAccountNotFound as jest.Mock).mockImplementation(() => {
      throw NotFoundError(
        EventCode.ACCOUNT_NOT_FOUND,
        "Account not found"
      )
    });

    await expect(transferService.fetchTransfers(
      mockMissingAccountId,
      buildTransferQueryInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.ACCOUNT_NOT_FOUND
    });

    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("should throw 403 if caller is not account owner", async () => {
    (throwIfNotAccountOwner as jest.Mock).mockImplementation(() => {
      throw ForbiddenError(
        EventCode.FORBIDDEN,
        "Transfers can only be read by account owners"
      )
    });

    await expect(transferService.fetchTransfers(
      mockAccountId1,
      buildTransferQueryInput(),
      buildAuthInput({ customerId: mockMissingCustomerId })
    )).rejects.toMatchObject({
      code: EventCode.FORBIDDEN
    });

    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("should throw 500 if prisma throws", async () => {
    mockFindMany.mockReset();
    mockFindMany.mockRejectedValue(new Error("DB failure"));

    await expect(transferService.fetchTransfers(
      mockAccountId1,
      buildTransferQueryInput(),
      buildAuthInput()
    )).rejects.toThrow();

    expect(mockFindMany).toHaveBeenCalled();
  });
});
