import request from "supertest";
import { createApp } from "../../../src/app";
import { Prisma } from "../../../src/generated/client";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { AccountStatus} from "../../../src/generated/enums";
import { 
  buildAccountOutput,
  buildAccountRecord
} from "../../accountMock";
import { 
  mockAccountId1,
  mockMissingAccountId,
  mockMissingCustomerId,
  mockRedisKey,
  mockSessionId
} from "../../commonMock";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn() }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: { account: {
    findUnique: jest.fn(),
    update: jest.fn(),
  } }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";

const app = createApp();

const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockUpdate = prismaClient.account.update as jest.Mock;
const mockRedisGet = redisClient.get as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;
beforeEach(async () => {
  jest.clearAllMocks();
  mockRedisGet.mockResolvedValue(mockEncryptedRedisPayload);
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
});

async function closeAccountRequest(
    accountId: string = mockAccountId1,
    sessionId: string = mockSessionId
  ) {
    return request(app)
      .post(`/accounts/${accountId}/close`)
      .set("x-session-id", sessionId);
  }

describe("POST /accounts/:accountId/close", () => {

  test("Account found for accountId => 200, account is closed and returned", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockUpdate.mockResolvedValue(buildAccountRecord({ 
      status: AccountStatus.CLOSED 
    }));

    const res = await closeAccountRequest();

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(buildAccountOutput({
      status: AccountStatus.CLOSED 
    }));
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("Close already closed account => 200", async () => {
    mockFindUnique
      .mockResolvedValueOnce(buildAccountRecord())
      .mockResolvedValueOnce(buildAccountRecord({
        status: AccountStatus.CLOSED
      }));
    mockUpdate
      .mockResolvedValueOnce(buildAccountRecord({
        status: AccountStatus.CLOSED
      }))
      .mockResolvedValueOnce(buildAccountRecord({
        status: AccountStatus.CLOSED
      }));

    const res1 = await closeAccountRequest(mockAccountId1);
    const res2 = await closeAccountRequest(mockAccountId1);
    
    expect(res1.status).toBe(200);
    expect(res1.headers).toHaveProperty("x-trace-id");
    expect(res2.status).toBe(200);
    expect(res2.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  test("accountId has invalid format => 400", async () => {
    const res = await closeAccountRequest("abc");

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("Account not found for accountId => 404", async () => {
    const mockError = { code: "P2025" } as any;
    Object.setPrototypeOf(
      mockError, Prisma.PrismaClientKnownRequestError.prototype
    );
    mockFindUnique.mockResolvedValue(null);

    const res = await closeAccountRequest(mockMissingAccountId);

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(0);
  });

  test("Account not owned by customer => 403", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput({
      customerId: mockMissingCustomerId
    })));

    const res = await closeAccountRequest(mockAccountId1);

    expect(res.status).toBe(403);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(0);
  });
});