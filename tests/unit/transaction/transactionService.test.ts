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
import {
  AccountStatus,
  TransactionType,
  UserRole,
} from "../../../src/generated/enums";
import * as transactionService from "../../../src/transaction/transactionService";
import { buildAccountRecord } from "../../accountMock";
import { buildAuthInput } from "../../authMock";
import {
  mockAccountId1,
  mockCustomerId,
  mockMissingAccountId,
} from "../../commonMock";
import {
  buildTransactionCreateInput,
  buildTransactionCreateInputWithoutOptionalFields,
  buildTransactionOutput,
  buildTransactionQueryInput,
  buildTransactionRecord,
  mockMissingTransactionId,
  mockTransactionId1,
  mockTransactionId2,
} from "../../transactionMock";

const mockPrismaTransaction = prismaClient.$transaction as jest.Mock;
const mockAccountFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockTransactionFindMany = prismaClient.transaction.findMany as jest.Mock;
const mockTransactionFindUnique = prismaClient.transaction.findUnique as jest.Mock;

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
});

describe("insertTransaction service", () => {
  it("should create a CREDIT transaction and increase the account balance", async () => {
    txMock.account.findUnique.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("250.00") })
    );
    txMock.transaction.create.mockResolvedValue(buildTransactionRecord());
    txMock.account.update.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("350.00") })
    );

    await expect(
      transactionService.insertTransaction(
        buildTransactionCreateInput(),
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
        amount: new Decimal("100.00"),
        description: "mock transaction description",
        category: "mock category",
      },
    });

    expect(txMock.account.update).toHaveBeenCalledWith({
      where: { id: mockAccountId1 },
      data: { balance: new Decimal("350.00") },
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
        buildTransactionCreateInputWithoutOptionalFields({
          type: TransactionType.DEBIT,
          amount: "50.00",
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
        buildTransactionCreateInput({
          type: TransactionType.DEBIT,
          amount: "50.00",
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
        buildTransactionCreateInput(),
        buildAuthInput()
      )
    ).rejects.toThrow(mockError);
  });
});

describe("fetchTransactions service", () => {
  it("should return retrieved transactions with default filters", async () => {
    mockAccountFindUnique.mockResolvedValue(buildAccountRecord());
    mockTransactionFindMany.mockResolvedValue([
      buildTransactionRecord(),
      buildTransactionRecord({
        id: mockTransactionId2,
        amount: new Decimal("60.00"),
      }),
    ]);

    await expect(
      transactionService.fetchTransactions(
        buildTransactionQueryInput(),
        buildAuthInput()
      )
    ).resolves.toMatchObject([
      buildTransactionOutput(),
      buildTransactionOutput({ id: mockTransactionId2, amount: "60" }),
    ]);

    expect(mockAccountFindUnique).toHaveBeenCalledWith({
      where: { id: mockAccountId1 },
    });

    expect(mockTransactionFindMany).toHaveBeenCalledWith({
      where: {
        account_id: mockAccountId1,
      },
      orderBy: { created_at: "desc" },
      take: 20,
      skip: 0,
    });
  });

  it("should include type, from, and to filters when provided", async () => {
    mockAccountFindUnique.mockResolvedValue(buildAccountRecord());
    mockTransactionFindMany.mockResolvedValue([]);

    await transactionService.fetchTransactions(
      buildTransactionQueryInput({
        type: TransactionType.DEBIT,
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-01-31T23:59:59.999Z",
        limit: 5,
        offset: 10,
      }),
      buildAuthInput()
    );

    expect(mockTransactionFindMany).toHaveBeenCalledWith({
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
    mockAccountFindUnique.mockResolvedValue(buildAccountRecord());
    mockTransactionFindMany.mockResolvedValue([]);

    await transactionService.fetchTransactions(
      buildTransactionQueryInput({ from: "2026-02-01T00:00:00.000Z" }),
      buildAuthInput()
    );

    expect(mockTransactionFindMany).toHaveBeenCalledWith({
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
    mockAccountFindUnique.mockResolvedValue(buildAccountRecord());
    mockTransactionFindMany.mockResolvedValue([]);

    await transactionService.fetchTransactions(
      buildTransactionQueryInput({ to: "2026-02-28T23:59:59.999Z" }),
      buildAuthInput()
    );

    expect(mockTransactionFindMany).toHaveBeenCalledWith({
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

  it("should throw a NotFoundError when the account does not exist", async () => {
    mockAccountFindUnique.mockResolvedValue(null);

    await expect(
      transactionService.fetchTransactions(
        buildTransactionQueryInput({ account_id: mockMissingAccountId }),
        buildAuthInput()
      )
    ).rejects.toThrow("Account not found");

    expect(mockTransactionFindMany).not.toHaveBeenCalled();
  });

  it("should throw a ForbiddenError when a standard user tries to read another customer's transactions", async () => {
    mockAccountFindUnique.mockResolvedValue(
      buildAccountRecord({ customer_id: "550e8400-e29b-41d4-a716-446655449999" })
    );

    await expect(
      transactionService.fetchTransactions(
        buildTransactionQueryInput(),
        buildAuthInput({
          role: UserRole.STANDARD,
          customerId: mockCustomerId,
        })
      )
    ).rejects.toThrow("Only account owners can read account transactions");

    expect(mockTransactionFindMany).not.toHaveBeenCalled();
  });

  it("should allow an admin user to read another customer's transactions", async () => {
    mockAccountFindUnique.mockResolvedValue(
      buildAccountRecord({ customer_id: "550e8400-e29b-41d4-a716-446655449999" })
    );
    mockTransactionFindMany.mockResolvedValue([buildTransactionRecord()]);

    await expect(
      transactionService.fetchTransactions(
        buildTransactionQueryInput(),
        buildAuthInput({ role: UserRole.ADMIN })
      )
    ).resolves.toMatchObject([buildTransactionOutput()]);
  });

  it("should rethrow when prisma throws while reading transactions", async () => {
    const mockError = new Error("Unknown error");
    mockAccountFindUnique.mockResolvedValue(buildAccountRecord());
    mockTransactionFindMany.mockRejectedValue(mockError);

    await expect(
      transactionService.fetchTransactions(
        buildTransactionQueryInput(),
        buildAuthInput()
      )
    ).rejects.toThrow(mockError);
  });
});

describe("fetchTransactionById service", () => {
  it("should return the fetched transaction given a valid transaction ID", async () => {
    mockTransactionFindUnique.mockResolvedValue(buildTransactionRecord());

    await expect(
      transactionService.fetchTransactionById(
        mockTransactionId1,
        buildAuthInput()
      )
    ).resolves.toMatchObject(buildTransactionOutput());

    expect(mockTransactionFindUnique).toHaveBeenCalledWith({
      where: { id: mockTransactionId1 },
    });
  });

  it("should throw a NotFoundError for a nonexistent transaction ID", async () => {
    mockTransactionFindUnique.mockResolvedValue(null);

    await expect(
      transactionService.fetchTransactionById(
        mockMissingTransactionId,
        buildAuthInput()
      )
    ).rejects.toThrow("Transaction not found");
  });

  it("should rethrow when prisma throws", async () => {
    const mockError = new Error("Unknown error");
    mockTransactionFindUnique.mockRejectedValue(mockError);

    await expect(
      transactionService.fetchTransactionById(
        mockTransactionId1,
        buildAuthInput()
      )
    ).rejects.toThrow(mockError);
  });
});