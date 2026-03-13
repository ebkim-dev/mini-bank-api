import request from "supertest";
import { createApp } from "../../../src/app";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { 
  buildAccountCreateOutput,
  buildAccountRecord,
} from "../../accountMock";
import { 
  mockAccountId2,
  mockCustomerId,
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
  default: { account: { findMany: jest.fn() } }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";

const app = createApp();

const mockFindMany = prismaClient.account.findMany as jest.Mock;
const mockRedisGet = redisClient.get as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;
beforeEach(async () => {
  jest.clearAllMocks();
  mockRedisGet.mockResolvedValue(mockEncryptedRedisPayload);
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
});

describe("GET /accounts", () => {
  async function getAccountsRequest(
    sessionId: string = mockSessionId
  ) {
    return request(app)
      .get("/accounts")
      .set("x-session-id", sessionId);
  }

  test("1+ account found for customerId => 200, array of found accounts is returned", async () => {
    mockFindMany.mockResolvedValue([
      buildAccountRecord(),
      buildAccountRecord({ id: mockAccountId2 })
    ]);

    const res = await getAccountsRequest();

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toEqual([
      buildAccountCreateOutput(),
      buildAccountCreateOutput({ id: mockAccountId2 }),
    ]);

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  test("No account found for customerId => 200, empty array is returned", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await getAccountsRequest();

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toEqual([]);

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it('should return 401 given invalid header', async () => {
    const res = await getAccountsRequest("asdnflsvbsabsl");

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });
});
