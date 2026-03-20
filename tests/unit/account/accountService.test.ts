jest.mock('../../../src/db/prismaClient', () => ({
  __esModule: true,
  default: {
    account: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));
import { 
  AccountStatus,
  UserRole
} from "../../../src/generated/enums";
import { 
  mockAccountId1,
  mockAccountId2,
  mockCustomerId1,
  mockMissingAccountId,
  mockMissingCustomerId
} from "../../commonMock";
import { 
  buildAccountCreateInput,
  buildAccountOutput,
  buildAccountRecord,
  buildAccountUpdateInput
} from '../../accountMock';
import * as accountService from "../../../src/account/accountService";
import prismaClient from '../../../src/db/prismaClient';
import { buildAuthInput } from '../../authMock';
import { buildPrismaError, NOT_FOUND_ERROR_CODE, NOT_FOUND_ERROR_MESSAGE, UNKNOWN_ERROR_CODE, UNKNOWN_ERROR_MESSAGE } from "../../errorMock";
import { buildTransactionRecord } from "../../transactionMock";
import { Decimal } from "@prisma/client/runtime/client";

const mockCreate = prismaClient.account.create as jest.Mock;
const mockFindMany = prismaClient.account.findMany as jest.Mock;
const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockUpdate = prismaClient.account.update as jest.Mock;
const mockTransactionFindMany = prismaClient.transaction.findMany as jest.Mock;
const mockTransactionGroupBy = prismaClient.transaction.groupBy as jest.Mock;
beforeEach(() => { jest.clearAllMocks(); });

describe("insertAccount service", () => {
  it("should return updated object given a valid account ID", async () => {
    mockCreate.mockResolvedValue(buildAccountRecord());

    await expect(accountService.insertAccount(
      buildAccountCreateInput(), 
      buildAuthInput()
    )).resolves.toMatchObject(buildAccountOutput());

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
  
  it("should rethrow when prisma throws", async () => {
    mockCreate.mockRejectedValue(
      buildPrismaError(UNKNOWN_ERROR_MESSAGE, UNKNOWN_ERROR_CODE)
    );

    await expect(accountService.insertAccount(
      buildAccountCreateInput(), 
      buildAuthInput()
    )).rejects.toThrow(UNKNOWN_ERROR_MESSAGE);

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});

describe("fetchAccountsByCustomerId service", () => {
  it("should return array of retrieved accounts given a valid customer ID", async () => {
    mockFindMany.mockResolvedValue([
      buildAccountRecord(), 
      buildAccountRecord({ id: mockAccountId2 })]
    );

    await expect(accountService.fetchAccountsByCustomerId(
      buildAuthInput({ role: UserRole.STANDARD })
    )).resolves.toMatchObject([
      buildAccountOutput(), 
      buildAccountOutput({ id: mockAccountId2 })
    ]);

    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it("should rethrow when prisma throws", async () => {
    mockFindMany.mockRejectedValue(
      buildPrismaError(UNKNOWN_ERROR_MESSAGE, UNKNOWN_ERROR_CODE)
    );

    await expect(accountService.fetchAccountsByCustomerId(
      buildAuthInput({ role: UserRole.STANDARD })
    )).rejects.toThrow(UNKNOWN_ERROR_MESSAGE);

    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });
});

describe("fetchAccountById service", () => {
  it("should return fetched accounts given a valid account ID", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());

    await expect(accountService.fetchAccountById(
      mockAccountId1, 
      buildAuthInput({ role: UserRole.STANDARD })
    )).resolves.toMatchObject(buildAccountOutput());

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });

  it("should throw a NotFoundError for a nonexistent account ID", async () => {
    mockFindUnique.mockResolvedValue(null);
   
    await expect(accountService.fetchAccountById(
      mockMissingAccountId, 
      buildAuthInput()
    )).rejects.toThrow(NOT_FOUND_ERROR_MESSAGE);

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });

  it("should throw a ForbiddenError if account is not owned by customer", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());

    await expect(accountService.fetchAccountById(
      mockAccountId1,
      buildAuthInput({ customerId: mockMissingCustomerId })
    )).rejects.toThrow("Only account owners can read accounts");

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });

  it("should rethrow when prisma throws", async () => {
    mockFindUnique.mockRejectedValue(
      buildPrismaError(UNKNOWN_ERROR_MESSAGE, UNKNOWN_ERROR_CODE)
    );

    await expect(accountService.fetchAccountById(
      mockAccountId1, 
      buildAuthInput())
    ).rejects.toThrow(UNKNOWN_ERROR_MESSAGE);

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });
});

describe("updateAccountById service", () => {
  it("should return updated object given a valid account ID", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockUpdate.mockResolvedValue({
      ...buildAccountRecord(),
      nickname: "asdf",
    });

    await expect(accountService.updateAccountById(
      mockAccountId1, 
      buildAccountUpdateInput(),
      buildAuthInput()
    )).resolves.toMatchObject({
      ...buildAccountOutput(),
      nickname: "asdf",
    });

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it("should throw a NotFoundError for a nonexistent account ID", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(accountService.updateAccountById(
      mockMissingAccountId, 
      buildAccountUpdateInput(), 
      buildAuthInput()
    )).rejects.toThrow(NOT_FOUND_ERROR_MESSAGE);

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(0);
  });

  it("should throw a ForbiddenError if account is not owned by customer", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());

    await expect(accountService.updateAccountById(
      mockAccountId1,
      buildAccountUpdateInput(), 
      buildAuthInput({ customerId: mockMissingCustomerId })
    )).rejects.toThrow("Only account owners can update accounts");

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(0);
  });
    
  it("should rethrow when prisma throws", async () => {
    mockFindUnique.mockRejectedValue(
      buildPrismaError(UNKNOWN_ERROR_MESSAGE, UNKNOWN_ERROR_CODE)
    );

    await expect(accountService.updateAccountById(
      mockMissingAccountId, 
      buildAccountUpdateInput(), 
      buildAuthInput()
    )).rejects.toThrow(UNKNOWN_ERROR_MESSAGE);

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(0);
  });
});

describe("deleteAccountById service", () => {
  it("should return closed object given a valid account ID", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockUpdate.mockResolvedValue({
      ...buildAccountRecord(),
      status: AccountStatus.CLOSED,
    });

    await expect(accountService.deleteAccountById(
      mockAccountId1,
      buildAuthInput()
    )).resolves.toMatchObject({
      ...buildAccountOutput(),
      status: AccountStatus.CLOSED,
    });
  });

  it("should throw a NotFoundError for a nonexistent account ID", async () => {
    mockFindUnique.mockResolvedValue(null);
   
    await expect(accountService.deleteAccountById(
      mockMissingAccountId,
      buildAuthInput()
    )).rejects.toThrow(NOT_FOUND_ERROR_MESSAGE);

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(0);
  });

  it("should throw a ForbiddenError if account is not owned by customer", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());

    await expect(accountService.deleteAccountById(
      mockAccountId1,
      buildAuthInput({ customerId: mockMissingCustomerId })
    )).rejects.toThrow("Only account owners can close accounts");

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(0);
  });
    
  it("should rethrow when prisma throws", async () => {
    mockFindUnique.mockRejectedValue(
      buildPrismaError(UNKNOWN_ERROR_MESSAGE, UNKNOWN_ERROR_CODE)
    );

    await expect(accountService.deleteAccountById(
      mockMissingAccountId,
      buildAuthInput()
    )).rejects.toThrow(UNKNOWN_ERROR_MESSAGE);

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(0);
  });
});

describe("fetchAccountSummary service", () => {
  it("should return account summary with recent transactions and counts", async () => {
    const mockAccount = buildAccountRecord({ balance: new Decimal("450.00") });
    const mockTransaction1 = buildTransactionRecord();
    const mockTransaction2 = buildTransactionRecord({
      id: "550e8400-e29b-41d4-a716-446655440031",
      type: "DEBIT" as any,
      amount: new Decimal("50.00"),
      description: "ATM withdrawal",
    });

    mockFindUnique.mockResolvedValue(mockAccount);
    mockTransactionFindMany.mockResolvedValue([mockTransaction1, mockTransaction2]);
    mockTransactionGroupBy.mockResolvedValue([
      { type: "CREDIT", _count: { type: 1 } },
      { type: "DEBIT", _count: { type: 1 } },
    ]);

    const result = await accountService.fetchAccountSummary(
      mockAccountId1,
      buildAuthInput()
    );

    expect(result.account_id).toBe(mockAccountId1);
    expect(result.balance).toBe("450");
    expect(result.currency).toBe("USD");
    expect(result.status).toBe(AccountStatus.ACTIVE);
    expect(result.total_credits).toBe(1);
    expect(result.total_debits).toBe(1);
    expect(result.recent_transactions).toHaveLength(2);
    expect(result.recent_transactions[0]!.amount).toBe("100");
    expect(result.recent_transactions[1]!.amount).toBe("50");

    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: mockAccountId1 } });
    expect(mockTransactionFindMany).toHaveBeenCalledWith({
      where: { account_id: mockAccountId1 },
      orderBy: { created_at: "desc" },
      take: 10,
    });
    expect(mockTransactionGroupBy).toHaveBeenCalledWith({
      by: ["type"],
      where: { account_id: mockAccountId1 },
      _count: { type: true },
    });
  });

  it("should return zero counts when no transactions exist", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockTransactionFindMany.mockResolvedValue([]);
    mockTransactionGroupBy.mockResolvedValue([]);

    const result = await accountService.fetchAccountSummary(
      mockAccountId1,
      buildAuthInput()
    );

    expect(result.total_credits).toBe(0);
    expect(result.total_debits).toBe(0);
    expect(result.recent_transactions).toHaveLength(0);
  });

  it("should return correct counts when only credits exist", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockTransactionFindMany.mockResolvedValue([]);
    mockTransactionGroupBy.mockResolvedValue([
      { type: "CREDIT", _count: { type: 3 } },
    ]);

    const result = await accountService.fetchAccountSummary(
      mockAccountId1,
      buildAuthInput()
    );

    expect(result.total_credits).toBe(3);
    expect(result.total_debits).toBe(0);
  });

  it("should throw a NotFoundError for a nonexistent account ID", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(accountService.fetchAccountSummary(
      mockMissingAccountId,
      buildAuthInput()
    )).rejects.toThrow(NOT_FOUND_ERROR_MESSAGE);

    expect(mockTransactionFindMany).not.toHaveBeenCalled();
    expect(mockTransactionGroupBy).not.toHaveBeenCalled();
  });

  it("should rethrow when prisma throws", async () => {
    mockFindUnique.mockRejectedValue(
      buildPrismaError(UNKNOWN_ERROR_MESSAGE, UNKNOWN_ERROR_CODE)
    );

    await expect(accountService.fetchAccountSummary(
      mockAccountId1,
      buildAuthInput()
    )).rejects.toThrow(UNKNOWN_ERROR_MESSAGE);
  });


  it("should return empty string for null transaction description", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockTransactionFindMany.mockResolvedValue([
      buildTransactionRecord({ description: null }),
    ]);
    mockTransactionGroupBy.mockResolvedValue([]);

    const result = await accountService.fetchAccountSummary(
      mockAccountId1,
      buildAuthInput()
    );

    expect(result.recent_transactions[0]!.description).toBe("");
  });
});