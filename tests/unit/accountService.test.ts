
jest.mock('../../src/db/prismaClient', () => ({
  __esModule: true,
  default: {
    account: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import * as accountService from "../../src/account/accountService";
import prismaClient from '../../src/db/prismaClient'
import { AccountType, AccountStatus, UserRole } from "../../src/generated/enums";
import { Decimal } from "@prisma/client/runtime/client";
import { Account, Prisma } from "../../src/generated/client";
import type { AccountCreateInput, AccountOutput, AccountUpdateInput } from "../../src/account/account";
import type { AuthInput } from '../../src/auth/user';

const mockAccountCreateInput: AccountCreateInput = {
  customer_id: 1n,
  type: AccountType.SAVINGS,
  currency: "USD",
}
const mockAccountUpdateInput: AccountUpdateInput = {
  nickname: "asdf",
  status: AccountStatus.ACTIVE,
}
const mockAuthInputAdmin: AuthInput = {
  role: UserRole.ADMIN
}
const mockAuthInputStandard: AuthInput = {
  role: UserRole.STANDARD
}

const date = new Date();
const mockAccountRecord1: Account = {
  id: 1n,
  customer_id: 1n,
  type: AccountType.SAVINGS,
  currency: "USD",
  nickname: "alice",
  status: AccountStatus.ACTIVE,
  balance: new Decimal(0),
  created_at: date,
  updated_at: date,
}
const mockAccountRecord2: Account = {
  id: 2n,
  customer_id: 1n,
  type: AccountType.CHECKING,
  currency: "USD",
  nickname: "bob",
  status: AccountStatus.ACTIVE,
  balance: new Decimal(0),
  created_at: date,
  updated_at: date,
}

const mockAccountOutput1: AccountOutput = {
  customer_id: 1n.toString(),
  type: AccountType.SAVINGS,
  currency: "USD",
  nickname: "alice",
  status: AccountStatus.ACTIVE,
  balance: (new Decimal(0)).toString(),
}
const mockAccountOutput2: AccountOutput = {
  customer_id: 1n.toString(),
  type: AccountType.CHECKING,
  currency: "USD",
  nickname: "bob",
  status: AccountStatus.ACTIVE,
  balance: (new Decimal(0)).toString(),
}

const UNKNOWN_ERROR_MESSAGE = "Unknown error";
const unknownPrismaError = new Prisma.PrismaClientKnownRequestError(
  UNKNOWN_ERROR_MESSAGE, 
  {
    code: "P9999999",
    clientVersion: "test",
  }
);
const NOT_FOUND_ERROR_MESSAGE = "Account not found";
const notFoundPrismaError = new Prisma.PrismaClientKnownRequestError(
  "Record not found", 
  {
    code: "P2025",
    clientVersion: "test",
  }
);

afterEach(() => {
  jest.resetAllMocks();
});

describe("insertAccount service", () => {
  it("should return updated object given a valid account ID", async() => {
    (prismaClient.account.create as jest.Mock)
      .mockResolvedValue(mockAccountRecord1);

    await expect(accountService.insertAccount(
        mockAccountCreateInput, 
        mockAuthInputAdmin
    )).resolves.toMatchObject(mockAccountOutput1);
  });

  it("should throw a ForbiddenError for an insufficient role", async() => {
    await expect(accountService.insertAccount(
      mockAccountCreateInput, 
      mockAuthInputStandard
    )).rejects.toThrow("Only admins can create accounts");
  });
  
  it("should rethrow when prisma throws", async () => {
    (prismaClient.account.create as jest.Mock)
      .mockRejectedValue(unknownPrismaError);

    await expect(accountService.insertAccount(
      mockAccountCreateInput, 
      mockAuthInputAdmin
    )).rejects.toThrow(UNKNOWN_ERROR_MESSAGE);
  });
});

describe("fetchAccountsByCustomerId service", () => {
  it("should return array of retrieved accounts given a valid customer ID", async() => {
    (prismaClient.account.findMany as jest.Mock)
      .mockResolvedValue([mockAccountRecord1, mockAccountRecord2]);

    await expect(accountService.fetchAccountsByCustomerId(1n))
      .resolves.toMatchObject([mockAccountOutput1, mockAccountOutput2]);
  });

  it("should rethrow when prisma throws", async () => {
    (prismaClient.account.findMany as jest.Mock)
      .mockRejectedValue(unknownPrismaError);

    await expect(accountService.fetchAccountsByCustomerId(1n))
      .rejects.toThrow(UNKNOWN_ERROR_MESSAGE);
  });
});

describe("fetchAccountById service", () => {
  it("should return fetched accounts given a valid account ID", async() => {
    (prismaClient.account.findUnique as jest.Mock)
      .mockResolvedValue(mockAccountRecord1);

    await expect(accountService.fetchAccountById(1n))
      .resolves.toMatchObject(mockAccountOutput1);
  });

  it("should throw a NotFoundError for a nonexistent account ID", async () => {
    (prismaClient.account.findUnique as jest.Mock)
      .mockResolvedValue(null);
   
    await expect(accountService.fetchAccountById(9999999n))
      .rejects
      .toThrow(NOT_FOUND_ERROR_MESSAGE);
  });

  it("should rethrow when prisma throws", async () => {
    (prismaClient.account.findUnique as jest.Mock)
      .mockRejectedValue(unknownPrismaError);

    await expect(accountService.fetchAccountById(1n))
      .rejects
      .toThrow(UNKNOWN_ERROR_MESSAGE);
  });
});

describe("updateAccountById service", () => {
  it("should return updated object given a valid account ID", async() => {
    (prismaClient.account.update as jest.Mock)
      .mockResolvedValue({
        ...mockAccountRecord1,
        nickname: "asdf",
      });

    await expect(accountService.updateAccountById(
      1n, 
      mockAccountUpdateInput,
      mockAuthInputAdmin
    )).resolves.toMatchObject({
      ...mockAccountOutput1,
      nickname: "asdf",
    });
  });

  it("should throw a ForbiddenError for an insufficient role", async() => {
    await expect(accountService.updateAccountById(
      9999999n, 
      mockAccountUpdateInput, 
      mockAuthInputStandard
    )).rejects
      .toThrow("Only admins can update accounts");
  });

  it("should throw a NotFoundError for a nonexistent account ID", async () => {
    (prismaClient.account.update as jest.Mock)
      .mockRejectedValue(notFoundPrismaError);
   
    await expect(accountService.updateAccountById(
      9999999n, 
      mockAccountUpdateInput, 
      mockAuthInputAdmin
    )).rejects
      .toThrow(NOT_FOUND_ERROR_MESSAGE);
  });
    
  it("should rethrow when prisma throws", async () => {
    (prismaClient.account.update as jest.Mock)
      .mockRejectedValue(unknownPrismaError);

    await expect(accountService.updateAccountById(
      9999999n, 
      mockAccountUpdateInput, 
      mockAuthInputAdmin
    )).rejects
      .toThrow(UNKNOWN_ERROR_MESSAGE);
  });
});

describe("deleteAccountById service", () => {
  it("should return closed object given a valid account ID", async() => {
    (prismaClient.account.update as jest.Mock)
      .mockResolvedValue({
        ...mockAccountRecord1,
        status: AccountStatus.CLOSED,
      });

    await expect(
      accountService.deleteAccountById(1n, mockAuthInputAdmin)
    ).resolves.toMatchObject({
      ...mockAccountOutput1,
      status: AccountStatus.CLOSED,
    });
  });

  it("should throw a ForbiddenError for an insufficient role", async() => {
    await expect(accountService.deleteAccountById(9999999n, mockAuthInputStandard))
      .rejects
      .toThrow("Only admins can close accounts");
  });

  it("should throw a NotFoundError for a nonexistent account ID", async () => {
    (prismaClient.account.update as jest.Mock)
      .mockRejectedValue(notFoundPrismaError);
   
    await expect(accountService.deleteAccountById(9999999n, mockAuthInputAdmin))
      .rejects
      .toThrow(NOT_FOUND_ERROR_MESSAGE);
  });
    
  it("should rethrow when prisma throws", async () => {
    (prismaClient.account.update as jest.Mock)
      .mockRejectedValue(unknownPrismaError);

    await expect(accountService.deleteAccountById(9999999n, mockAuthInputAdmin))
      .rejects
      .toThrow(UNKNOWN_ERROR_MESSAGE);
  });
});