import request from "supertest";
import { createApp } from "../../../src/app";
import { 
  buildAccountCreateOutput,
  buildAccountRecord,
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
  default: { account: { findUnique: jest.fn() } }
}));
import prismaClient from "../../../src/db/prismaClient";
import { buildAuthInput } from "../../authMock";

const app = createApp();

const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockRedisGet = redisClient.get as jest.Mock;
beforeEach(async () => {
  jest.clearAllMocks();
  mockRedisGet.mockResolvedValue(
    JSON.stringify(buildAuthInput())
  );
});

describe("GET /accounts/:accountId", () => {
  async function getAccountRequest(accountId: string) {
    return request(app)
      .get(`/accounts/${accountId}`)
      .set("x-session-id", mockSessionId);
  }

  test("Account found for accountId => 200, account is returned", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());

    const res = await getAccountRequest(mockAccountId1);

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(buildAccountCreateOutput());
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });

  test("accountId has invalid format => 400", async () => {
    const res = await getAccountRequest("abc");

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
  });

  test("Account not found for accountId => 404", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await getAccountRequest(mockMissingAccountId);

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
  });

  it('should return 401 given missing token', async () => {
    const res = await request(app).get(`/accounts/${mockAccountId1}`);

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });
});
