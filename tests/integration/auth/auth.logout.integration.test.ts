import request from "supertest";
import { createApp } from "../../../src/app";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { mockRedisKey, mockSessionId } from "../../commonMock";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn(), del: jest.fn() }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";

const app = createApp();

const mockRedisGet = redisClient.get as jest.Mock;
const mockRedisDel = redisClient.del as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRedisGet.mockResolvedValue(mockEncryptedRedisPayload);
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
  mockRedisDel.mockResolvedValue(1);
});

async function logoutRequest(sessionId: string = mockSessionId) {
  const req = request(app).post("/auth/logout");
  if (sessionId) {
    req.set("x-session-id", sessionId);
  }
  return req.send();
}

describe("POST /auth/logout", () => {

  test("Valid session => 204, session is deleted from Redis", async () => {
    const res = await logoutRequest();

    expect(res.status).toBe(204);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toEqual({});
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(redisClient.del).toHaveBeenCalledWith(mockRedisKey);
  });

  test("Missing x-session-id header => 401", async () => {
    const res = await request(app).post("/auth/logout").send();

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.get).not.toHaveBeenCalled();
    expect(redisClient.del).not.toHaveBeenCalled();
  });

  test("Empty x-session-id header => 401", async () => {
    const res = await logoutRequest("");

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.del).not.toHaveBeenCalled();
  });

  test("Invalid (non-UUID) x-session-id header => 401", async () => {
    const res = await logoutRequest("not-a-valid-uuid");

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.get).not.toHaveBeenCalled();
    expect(redisClient.del).not.toHaveBeenCalled();
  });

  test("Session not found in Redis (expired/invalid) => 401", async () => {
    mockRedisGet.mockResolvedValue(null);

    const res = await logoutRequest();

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(redisClient.del).not.toHaveBeenCalled();
  });

  test("Decrypt throws (corrupted session data) => 401", async () => {
    mockDecrypt.mockImplementation(() => { throw new Error("bad decrypt"); });

    const res = await logoutRequest();

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.del).not.toHaveBeenCalled();
  });

  test("Redis del failure => 500", async () => {
    mockRedisDel.mockRejectedValue(new Error("Redis connection lost"));

    const res = await logoutRequest();

    expect(res.status).toBe(500);
    expect(res.headers).toHaveProperty("x-trace-id");
  });
});