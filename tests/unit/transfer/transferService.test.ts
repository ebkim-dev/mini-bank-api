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
import { buildPrismaError, NOT_FOUND_ERROR_MESSAGE, UNKNOWN_ERROR_CODE, UNKNOWN_ERROR_MESSAGE } from "../../errorMock";

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
prismaClient.$transaction = jest.fn().mockImplementation(cb => cb(mockTx));

const mockCreate = prismaClient.account.create as jest.Mock;
const mockFindMany = prismaClient.account.findMany as jest.Mock;
const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockUpdate = prismaClient.account.update as jest.Mock;
beforeEach(() => { jest.clearAllMocks(); });

describe("insertTransfer service", () => {
  it("should return new transfer record given valid inputs", async () => {
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