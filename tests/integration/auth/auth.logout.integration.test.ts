import request from "supertest";
import { createApp } from "../../../src/app";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { mockRedisKey, mockSessionId } from "../../commonMock";
import {
  EXTENSION_THRESHOLD_SEC,
  EXTENSION_AMOUNT_SEC,
} from "../../../src/auth/authService";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: {
    multi: jest.fn(() => ({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    })),
    expire: jest.fn(),
    del: jest.fn(),
  }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";

const app = createApp();

const mockDecrypt = decrypt as jest.Mock;
const healthyTtl = EXTENSION_THRESHOLD_SEC + 1;

function getMockChain() {
  return (redisClient.multi as jest.Mock).mock.results[0]?.value;
}

beforeEach(() => {
  jest.clearAllMocks();
  (redisClient.multi as jest.Mock).mockReturnValue({
    get: jest.fn().mockReturnThis(),
    ttl: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([mockEncryptedRedisPayload, healthyTtl]),
  });
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
  (redisClient.del as jest.Mock).mockResolvedValue(1);
  (redisClient.expire as jest.Mock).mockResolvedValue(1);
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
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(redisClient.del).toHaveBeenCalledWith(mockRedisKey);
  });

  test("Missing x-session-id header => 401", async () => {
    const res = await request(app).post("/auth/logout").send();

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).not.toHaveBeenCalled();
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
    expect(redisClient.multi).not.toHaveBeenCalled();
    expect(redisClient.del).not.toHaveBeenCalled();
  });

  test("Session not found in Redis (expired/invalid) => 401", async () => {
    (redisClient.multi as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([null, -2]),
    });

    const res = await logoutRequest();

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
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
    (redisClient.del as jest.Mock).mockRejectedValue(new Error("Redis connection lost"));

    const res = await logoutRequest();

    expect(res.status).toBe(500);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  // ===== TTL extension tests =====

  test("Session with healthy TTL => 204, no extension triggered", async () => {
    const res = await logoutRequest();

    expect(res.status).toBe(204);
    expect(redisClient.expire).not.toHaveBeenCalled();
  });

  test("Session with TTL at threshold => 204, session extended before logout", async () => {
    (redisClient.multi as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockEncryptedRedisPayload, EXTENSION_THRESHOLD_SEC]),
    });

    const res = await logoutRequest();

    expect(res.status).toBe(204);
    expect(redisClient.expire).toHaveBeenCalledWith(mockRedisKey, EXTENSION_AMOUNT_SEC);
    expect(redisClient.del).toHaveBeenCalledWith(mockRedisKey);
  });

  test("Session with TTL below threshold => 204, session extended before logout", async () => {
    (redisClient.multi as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockEncryptedRedisPayload, EXTENSION_THRESHOLD_SEC - 1]),
    });

    const res = await logoutRequest();

    expect(res.status).toBe(204);
    expect(redisClient.expire).toHaveBeenCalledWith(mockRedisKey, EXTENSION_AMOUNT_SEC);
    expect(redisClient.del).toHaveBeenCalledWith(mockRedisKey);
  });

  test("EXPIRE failure during logout => 204, logout still succeeds", async () => {
    (redisClient.multi as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockEncryptedRedisPayload, EXTENSION_THRESHOLD_SEC - 1]),
    });
    (redisClient.expire as jest.Mock).mockRejectedValue(new Error("Redis connection lost"));

    const res = await logoutRequest();

    expect(res.status).toBe(204);
    expect(redisClient.del).toHaveBeenCalledWith(mockRedisKey);
  });
});