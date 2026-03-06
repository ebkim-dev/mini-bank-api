jest.mock('../../../src/db/prismaClient', () => ({
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
  AccountStatus,
  UserRole
} from "../../../src/generated/enums";
import { 
  mockAccountId1,
  mockAccountId2,
  mockCustomerId,
  mockMissingAccountId
} from "../../commonMock";
import { 
  buildAccountCreateInput,
  buildAccountOutput,
  buildAccountRecord,
  buildAccountUpdateInput
} from '../../accountMock';
import * as accountService from "../../../src/account/accountService";
import prismaClient from '../../../src/db/prismaClient';
import { Prisma } from "../../../src/generated/client";
import { buildAuthInput } from '../../authMock';

const UNKNOWN_ERROR_MESSAGE = "Unknown error";
const unknownPrismaError = new Prisma.PrismaClientKnownRequestError(
  UNKNOWN_ERROR_MESSAGE, 
  { code: "P9999999", clientVersion: "test" }
);
const NOT_FOUND_ERROR_MESSAGE = "Account not found";
const notFoundPrismaError = new Prisma.PrismaClientKnownRequestError(
  "Record not found", 
  { code: "P2025", clientVersion: "test" }
);

const mockCreate = prismaClient.account.create as jest.Mock;
const mockFindMany = prismaClient.account.findMany as jest.Mock;
const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockUpdate = prismaClient.account.update as jest.Mock;
beforeEach(() => { jest.clearAllMocks(); });

describe("insertAccount service", () => {
  it("should return updated object given a valid account ID", async () => {
    mockCreate.mockResolvedValue(buildAccountRecord());

    await expect(accountService.insertAccount(
      buildAccountCreateInput(), 
      buildAuthInput()
    )).resolves.toMatchObject(buildAccountOutput());
  });

  it("should throw a ForbiddenError for an insufficient role", async () => {
    await expect(accountService.insertAccount(
      buildAccountCreateInput(), 
      buildAuthInput({ role: UserRole.STANDARD })
    )).rejects.toThrow("Only admins can create accounts");
  });
  
  it("should rethrow when prisma throws", async () => {
    mockCreate.mockRejectedValue(unknownPrismaError);

    await expect(accountService.insertAccount(
      buildAccountCreateInput(), 
      buildAuthInput()
    )).rejects.toThrow(UNKNOWN_ERROR_MESSAGE);
  });
});

describe("fetchAccountsByCustomerId service", () => {
  it("should return array of retrieved accounts given a valid customer ID", async () => {
    mockFindMany.mockResolvedValue([
      buildAccountRecord(), 
      buildAccountRecord({ id: mockAccountId2 })]
    );

    await expect(accountService.fetchAccountsByCustomerId(
      mockCustomerId, 
      buildAuthInput({ role: UserRole.STANDARD })
    )).resolves.toMatchObject([
      buildAccountOutput(), 
      buildAccountOutput({ id: mockAccountId2 })
    ]);
  });

  it("should rethrow when prisma throws", async () => {
    mockFindMany.mockRejectedValue(unknownPrismaError);

    await expect(accountService.fetchAccountsByCustomerId(
      mockCustomerId, 
      buildAuthInput({ role: UserRole.STANDARD })
    )).rejects.toThrow(UNKNOWN_ERROR_MESSAGE);
  });
});

describe("fetchAccountById service", () => {
  it("should return fetched accounts given a valid account ID", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());

    await expect(accountService.fetchAccountById(
      mockAccountId1, 
      buildAuthInput({ role: UserRole.STANDARD })
    )).resolves.toMatchObject(buildAccountOutput());
  });

  it("should throw a NotFoundError for a nonexistent account ID", async () => {
    mockFindUnique.mockResolvedValue(null);
   
    await expect(accountService.fetchAccountById(
      mockMissingAccountId, 
      buildAuthInput()
    )).rejects.toThrow(NOT_FOUND_ERROR_MESSAGE);
  });

  it("should rethrow when prisma throws", async () => {
    mockFindUnique.mockRejectedValue(unknownPrismaError);

    await expect(accountService.fetchAccountById(
      mockAccountId1, 
      buildAuthInput())
    ).rejects.toThrow(UNKNOWN_ERROR_MESSAGE);
  });
});

describe("updateAccountById service", () => {
  it("should return updated object given a valid account ID", async () => {
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
  });

  it("should throw a ForbiddenError for an insufficient role", async () => {
    await expect(accountService.updateAccountById(
      mockMissingAccountId, 
      buildAccountUpdateInput(), 
      buildAuthInput({ role: UserRole.STANDARD })
    )).rejects
      .toThrow("Only admins can update accounts");
  });

  it("should throw a NotFoundError for a nonexistent account ID", async () => {
    mockUpdate.mockRejectedValue(notFoundPrismaError);
   
    await expect(accountService.updateAccountById(
      mockMissingAccountId, 
      buildAccountUpdateInput(), 
      buildAuthInput()
    )).rejects.toThrow(NOT_FOUND_ERROR_MESSAGE);
  });
    
  it("should rethrow when prisma throws", async () => {
    mockUpdate.mockRejectedValue(unknownPrismaError);

    await expect(accountService.updateAccountById(
      mockMissingAccountId, 
      buildAccountUpdateInput(), 
      buildAuthInput()
    )).rejects.toThrow(UNKNOWN_ERROR_MESSAGE);
  });
});

describe("deleteAccountById service", () => {
  it("should return closed object given a valid account ID", async () => {
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

  it("should throw a ForbiddenError for an insufficient role", async () => {
    await expect(accountService.deleteAccountById(
      mockMissingAccountId,
      buildAuthInput({ role: UserRole.STANDARD })
    )).rejects.toThrow("Only admins can close accounts");
  });

  it("should throw a NotFoundError for a nonexistent account ID", async () => {
    mockUpdate.mockRejectedValue(notFoundPrismaError);
   
    await expect(accountService.deleteAccountById(
      mockMissingAccountId,
      buildAuthInput()
    )).rejects.toThrow(NOT_FOUND_ERROR_MESSAGE);
  });
    
  it("should rethrow when prisma throws", async () => {
    mockUpdate.mockRejectedValue(unknownPrismaError);

    await expect(accountService.deleteAccountById(
      mockMissingAccountId,
      buildAuthInput()
    )).rejects.toThrow(UNKNOWN_ERROR_MESSAGE);
  });
});