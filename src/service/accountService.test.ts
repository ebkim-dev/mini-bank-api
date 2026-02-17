
jest.mock('../db/prismaClient', () => ({
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

import { 
  AccountType,
  AccountStatus,
 } from "../types/account";

import * as accountService from "../service/accountService";
import prismaClient from '../db/prismaClient'

import { Decimal } from "@prisma/client/runtime/client";
import { Prisma } from "../generated/client";

const mockAccount1 = {
  id: 1n,
  customer_id: 1n,
  type: AccountType.SAVINGS,
  currency: "USD",
  nickname: "alice",
  status: AccountStatus.ACTIVE,
  balance: new Decimal(0),
};

const mockAccount2 = {
  id: 2n,
  customer_id: 1n,
  type: AccountType.CHECKING,
  currency: "USD",
  nickname: "bob",
  status: AccountStatus.ACTIVE,
  balance: new Decimal(0),
};

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe("insertAccount service", () => {
  it ("should return updated object given a valid account ID", async() => {
    const date = new Date();
    const mockAccount = {
      ...mockAccount1,
      created_by: date,
      updated_by: date,
    };

    (prismaClient.account.create as jest.Mock).mockResolvedValue(mockAccount);

    const req: any = {
      validated: {
        body: {
          customer_id: 1n,
          type: "SAVINGS",
          currency: "USD",
        },
      },
    };

    await expect(
      accountService.insertAccount(req)
    ).resolves.toMatchObject(mockAccount);
  });
});

describe("fetchAccountsByCustomerId service", () => {
  it ("should return array of retrieved accounts given a valid customer ID", async() => {
    (prismaClient.account.findMany as jest.Mock).mockResolvedValue([mockAccount1, mockAccount2]);

    await expect(
      accountService.fetchAccountsByCustomerId(1n)
    ).resolves.toMatchObject([mockAccount1, mockAccount2]);
  });
});

describe("fetchAccountById service", () => {
  it ("should return fetched accounts given a valid account ID", async() => {
    (prismaClient.account.findUnique as jest.Mock).mockResolvedValue(mockAccount1);

    await expect(
      accountService.fetchAccountById(9999999n)
    ).resolves.toMatchObject(mockAccount1);
  });

  it("should throw an error for a nonexistent account ID", async () => {
    (prismaClient.account.findUnique as jest.Mock).mockResolvedValue(null);
   
    await expect(accountService.fetchAccountById(9999999n))
      .rejects
      .toThrow("Account not found");
  });
});

describe("updateAccountById service", () => {
  it ("should return updated object given a valid account ID", async() => {
    const mockUpdateBody = {
      nickname: "alice",
      status: AccountStatus.ACTIVE,
    };

    (prismaClient.account.update as jest.Mock).mockResolvedValue(mockAccount1);

    await expect(
      accountService.updateAccountById(9999999n, mockUpdateBody)
    ).resolves.toMatchObject(mockAccount1);
  });

  it("should throw an error for a nonexistent account ID", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "test",
    });
    (prismaClient.account.update as jest.Mock).mockRejectedValue(error);

    const mockUpdateBody = {
      nickname: "alice",
      status: AccountStatus.ACTIVE,
    };
   
    await expect(accountService.updateAccountById(9999999n, mockUpdateBody))
      .rejects
      .toThrow("Account not found");
  });
    
  it("should rethrow when prisma throws", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unknown error", {
      code: "P9999999",
      clientVersion: "test",
    });
    (prismaClient.account.update as jest.Mock).mockRejectedValue(error);

    const mockUpdateBody = {
      nickname: "alice",
      status: AccountStatus.ACTIVE,
    };

    await expect(accountService.updateAccountById(9999999n, mockUpdateBody))
      .rejects
      .toThrow("Unknown error");
  });
});

describe("deleteAccountById service", () => {
  it ("should return closed object given a valid account ID", async() => {
    const returnObject = {
      id: 9999999n,
      status: AccountStatus.CLOSED,
    };

    (prismaClient.account.update as jest.Mock).mockResolvedValue(returnObject);

    await expect(
      accountService.deleteAccountById(9999999n)
    ).resolves.toMatchObject(returnObject);
  });

  it("should throw an error for a nonexistent account ID", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "test",
    });
    (prismaClient.account.update as jest.Mock).mockRejectedValue(error);
   
    await expect(accountService.deleteAccountById(9999999n))
      .rejects
      .toThrow("Account not found");
  });
    
  it("should rethrow when prisma throws", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unknown error", {
      code: "P9999999",
      clientVersion: "test",
    });
    (prismaClient.account.update as jest.Mock).mockRejectedValue(error);

    await expect(accountService.deleteAccountById(9999999n))
      .rejects
      .toThrow("Unknown error");
  });
});