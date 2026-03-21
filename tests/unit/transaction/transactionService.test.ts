jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    account: {
      findUnique: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { Decimal } from "@prisma/client/runtime/client";
import prismaClient from "../../../src/db/prismaClient";
import { AccountStatus, TransactionType } from "../../../src/generated/enums";
import * as transactionService from "../../../src/transaction/transactionService";
import { buildAccountRecord } from "../../accountMock";
import { buildAuthInput } from "../../authMock";
import {
  mockAccountId1,
  mockAmount,
  mockMissingTransactionId,
  mockTransactionId1,
  mockTransactionId2
} from "../../commonMock";
import {
  buildTransactionCreateInput,
  buildTransactionOutput,
  buildTransactionQueryInput,
  buildTransactionRecord,
} from "../../transactionMock";

const mockPrismaTransaction = prismaClient.$transaction as jest.Mock;
const mockAccountFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockFindMany = prismaClient.transaction.findMany as jest.Mock;
const mockFindUnique = prismaClient.transaction.findUnique as jest.Mock;

type TxMock = {
  account: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  transaction: {
    create: jest.Mock;
  };
};

let txMock: TxMock;

beforeEach(() => {
  jest.clearAllMocks();

  txMock = {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
  };

  mockPrismaTransaction.mockImplementation(
    async (callback: (tx: TxMock) => unknown) => {
      return callback(txMock);
    }
  );

  mockAccountFindUnique.mockResolvedValue(buildAccountRecord());
});

describe("insertTransaction service", () => {
  it("should create a CREDIT transaction and increase the account balance", async () => {
    txMock.account.findUnique.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("250.00") })
    );
    txMock.transaction.create.mockResolvedValue(buildTransactionRecord());
    txMock.account.update.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("300.00") })
    );

    await expect(
      transactionService.insertTransaction(
        mockAccountId1,
        buildTransactionCreateInput({
          category: "mock category",
          description: "mock transaction description"
        }),
        buildAuthInput()
      )
    ).resolves.toMatchObject(buildTransactionOutput());

    expect(txMock.account.findUnique).toHaveBeenCalledWith({
      where: { id: mockAccountId1 },
    });

    expect(txMock.transaction.create).toHaveBeenCalledWith({
      data: {
        account_id: mockAccountId1,
        type: TransactionType.CREDIT,
        amount: mockAmount,
        description: "mock transaction description",
        category: "mock category",
      },
    });

    expect(txMock.account.update).toHaveBeenCalledWith({
      where: { id: mockAccountId1 },
      data: { balance: new Decimal("300.00") },
    });
  });

  it("should create a DEBIT transaction, decrease the balance, and store null for missing optional fields", async () => {
    txMock.account.findUnique.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("250.00") })
    );
    txMock.transaction.create.mockResolvedValue(
      buildTransactionRecord({
        type: TransactionType.DEBIT,
        amount: new Decimal("50.00"),
        description: null,
        category: null,
      })
    );
    txMock.account.update.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("200.00") })
    );

    await expect(
      transactionService.insertTransaction(
        mockAccountId1,
        buildTransactionCreateInput({
          type: TransactionType.DEBIT,
        }),
        buildAuthInput()
      )
    ).resolves.toMatchObject(
      buildTransactionOutput({
        type: TransactionType.DEBIT,
        amount: "50",
        description: "",
        category: "",
      })
    );

    expect(txMock.transaction.create).toHaveBeenCalledWith({
      data: {
        account_id: mockAccountId1,
        type: TransactionType.DEBIT,
        amount: new Decimal("50.00"),
        description: null,
        category: null,
      },
    });

    expect(txMock.account.update).toHaveBeenCalledWith({
      where: { id: mockAccountId1 },
      data: { balance: new Decimal("200.00") },
    });
  });

  it("should throw a NotFoundError for a nonexistent account ID", async () => {
    txMock.account.findUnique.mockResolvedValue(null);

    await expect(
      transactionService.insertTransaction(
        mockAccountId1,
        buildTransactionCreateInput(),
        buildAuthInput()
      )
    ).rejects.toThrow("Account not found");

    expect(txMock.transaction.create).not.toHaveBeenCalled();
    expect(txMock.account.update).not.toHaveBeenCalled();
  });

  it("should throw a ConflictError when the account is not ACTIVE", async () => {
    txMock.account.findUnique.mockResolvedValue(
      buildAccountRecord({ status: AccountStatus.CLOSED })
    );

    await expect(
      transactionService.insertTransaction(
        mockAccountId1,
        buildTransactionCreateInput(),
        buildAuthInput()
      )
    ).rejects.toThrow("Account is not active");

    expect(txMock.transaction.create).not.toHaveBeenCalled();
    expect(txMock.account.update).not.toHaveBeenCalled();
  });

  it("should throw a ConflictError when a DEBIT would overdraw the account", async () => {
    txMock.account.findUnique.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("40.00") })
    );

    await expect(
      transactionService.insertTransaction(
        mockAccountId1,
        buildTransactionCreateInput({
          type: TransactionType.DEBIT,
          amount: new Decimal("50.00"),
        }),
        buildAuthInput()
      )
    ).rejects.toThrow("Insufficient funds");

    expect(txMock.transaction.create).not.toHaveBeenCalled();
    expect(txMock.account.update).not.toHaveBeenCalled();
  });

  it("should rethrow when prisma transaction fails", async () => {
    const mockError = new Error("Unknown error");
    mockPrismaTransaction.mockRejectedValue(mockError);

    await expect(
      transactionService.insertTransaction(
        mockAccountId1,
        buildTransactionCreateInput(),
        buildAuthInput()
      )
    ).rejects.toThrow(mockError);
  });
});

describe("fetchTransactions service", () => {
  it("should return retrieved transactions with default filters", async () => {
    mockFindMany.mockResolvedValue([
      buildTransactionRecord(),
      buildTransactionRecord({
        id: mockTransactionId2,
        amount: new Decimal("60.00"),
      }),
    ]);

    await expect(
      transactionService.fetchTransactions(
        mockAccountId1,
        buildTransactionQueryInput(),
        buildAuthInput()
      )
    ).resolves.toMatchObject([
      buildTransactionOutput(),
      buildTransactionOutput({ id: mockTransactionId2, amount: "60" }),
    ]);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        account_id: mockAccountId1,
      },
      orderBy: { created_at: "desc" },
      take: 20,
      skip: 0,
    });
  });

  it("should include type, from, and to filters when provided", async () => {
    mockFindMany.mockResolvedValue([]);

    await transactionService.fetchTransactions(
      mockAccountId1,
      buildTransactionQueryInput({
        type: TransactionType.DEBIT,
        from: new Date("2026-01-01T00:00:00.000Z"),
        to: new Date("2026-01-31T23:59:59.999Z"),
        limit: 5,
        offset: 10,
      }),
      buildAuthInput()
    );

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        account_id: mockAccountId1,
        type: TransactionType.DEBIT,
        created_at: {
          gte: new Date("2026-01-01T00:00:00.000Z"),
          lte: new Date("2026-01-31T23:59:59.999Z"),
        },
      },
      orderBy: { created_at: "desc" },
      take: 5,
      skip: 10,
    });
  });

  it("should include only the from date when only from is provided", async () => {
    mockFindMany.mockResolvedValue([]);

    await transactionService.fetchTransactions(
      mockAccountId1,
      buildTransactionQueryInput({
        from: new Date("2026-02-01T00:00:00.000Z")
      }),
      buildAuthInput()
    );

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        account_id: mockAccountId1,
        created_at: {
          gte: new Date("2026-02-01T00:00:00.000Z"),
        },
      },
      orderBy: { created_at: "desc" },
      take: 20,
      skip: 0,
    });
  });

  it("should include only the to date when only to is provided", async () => {
    mockFindMany.mockResolvedValue([]);

    await transactionService.fetchTransactions(
      mockAccountId1,
      buildTransactionQueryInput({
        to: new Date("2026-02-28T23:59:59.999Z")
      }),
      buildAuthInput()
    );

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        account_id: mockAccountId1,
        created_at: {
          lte: new Date("2026-02-28T23:59:59.999Z"),
        },
      },
      orderBy: { created_at: "desc" },
      take: 20,
      skip: 0,
    });
  });

  it("should rethrow when prisma throws", async () => {
    const mockError = new Error("Unknown error");
    mockAccountFindUnique.mockRejectedValue(mockError);

    await expect(
      transactionService.fetchTransactions(
        mockAccountId1,
        buildTransactionQueryInput(),
        buildAuthInput()
      )
    ).rejects.toThrow(mockError);
  });
});

describe("fetchTransactionById service", () => {
  it("should return the fetched transaction given a valid transaction ID", async () => {
    mockFindUnique.mockResolvedValue({
      ...buildTransactionRecord(),
      account: buildAccountRecord({ id: mockAccountId1 })
    });

    await expect(
      transactionService.fetchTransactionById(
        mockTransactionId1,
        buildAuthInput()
      )
    ).resolves.toMatchObject(buildTransactionOutput());

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: mockTransactionId1 },
      include: { account: true },
    });
  });

  it("should throw a NotFoundError for a nonexistent transaction ID", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(
      transactionService.fetchTransactionById(
        mockMissingTransactionId,
        buildAuthInput()
      )
    ).rejects.toThrow("Transaction not found");
  });

  it("should rethrow when prisma throws", async () => {
    const mockError = new Error("Unknown error");
    mockFindUnique.mockRejectedValue(mockError);

    await expect(
      transactionService.fetchTransactionById(
        mockTransactionId1,
        buildAuthInput()
      )
    ).rejects.toThrow(mockError);
  });
});