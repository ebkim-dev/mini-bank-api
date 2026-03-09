import request from "supertest";
import { createApp } from "../../../src/app";
import { Prisma } from "../../../src/generated/client";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { AccountStatus, UserRole } from "../../../src/generated/enums";
import { 
  buildAccountOutput,
  buildAccountRecord
} from "../../accountMock";
import { 
  mockAccountId1,
  mockMissingAccountId,
  mockRedisKey,
  mockSessionId
} from "../../commonMock";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn() }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: { account: { update: jest.fn() } }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";

const app = createApp();

const mockUpdate = prismaClient.account.update as jest.Mock;
const mockRedisGet = redisClient.get as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;
beforeEach(async () => {
  jest.clearAllMocks();
  mockRedisGet.mockResolvedValue(mockEncryptedRedisPayload);
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
});

describe("POST /accounts/:accountId/close", () => {
  async function closeAccountRequest(
    accountId: string = mockAccountId1,
    sessionId: string = mockSessionId
  ) {
    return request(app)
      .post(`/accounts/${accountId}/close`)
      .set("x-session-id", sessionId);
  }

  test("Account found for accountId => 200, account is closed and returned", async () => {
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
      mockError,
      Prisma.PrismaClientKnownRequestError.prototype
    );
    mockUpdate.mockRejectedValue(mockError);

    const res = await closeAccountRequest(mockMissingAccountId);

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("Close already closed account => 200", async () => {
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

  it('should return 403 given STANDARD role', async() => {
    mockDecrypt.mockReturnValue(JSON.stringify(
      buildAuthInput({ role: UserRole.STANDARD })
    ));

    const res = await closeAccountRequest(mockAccountId1);

    expect(res.status).toBe(403);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});