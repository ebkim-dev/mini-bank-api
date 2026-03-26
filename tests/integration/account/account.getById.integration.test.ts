import request from "supertest";
import { createApp } from "../../../src/app";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { 
  buildAccountCreateOutput,
  buildAccountRecord,
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
  default: { account: { findUnique: jest.fn() } }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";

const app = createApp();

const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockRedisGet = redisClient.get as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;
beforeEach(async () => {
  jest.clearAllMocks();
  mockRedisGet.mockResolvedValue(mockEncryptedRedisPayload);
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
});

async function getAccountRequest(accountId: string) {
  return request(app)
    .get(`/accounts/${accountId}`)
    .set("x-session-id", mockSessionId);
}

describe("GET /accounts/:accountId", () => {

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

  test('Session ID not passed => 401', async () => {
    const res = await request(app).get(`/accounts/${mockAccountId1}`);

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });
    
  test("Account not owned by customer => 403", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput({
      customerId: mockMissingCustomerId
    })));

    const res = await getAccountRequest(mockAccountId1);

    expect(res.status).toBe(403);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });

  test("Account not found for accountId => 404", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await getAccountRequest(mockMissingAccountId);

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });
});
