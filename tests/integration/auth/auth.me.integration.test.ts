import request from "supertest";
import { createApp } from "../../../src/app";
import { UserRole } from "../../../src/generated/enums";
import {
  buildAuthInput,
  buildMeOutput,
  buildUserWithCustomer,
  mockEncryptedRedisPayload,
} from "../../authMock";
import {
  mockRedisKey,
  mockSessionId,
} from "../../commonMock";
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
  }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: { user: { findUnique: jest.fn() } }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";

const app = createApp();

const mockDecrypt = decrypt as jest.Mock;
const mockFindUnique = prismaClient.user.findUnique as jest.Mock;
const healthyTtl = EXTENSION_THRESHOLD_SEC + 1;

beforeEach(() => {
  jest.clearAllMocks();
  (redisClient.multi as jest.Mock).mockReturnValue({
    get: jest.fn().mockReturnThis(),
    ttl: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([mockEncryptedRedisPayload, healthyTtl]),
  });
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
  mockFindUnique.mockResolvedValue(buildUserWithCustomer());
  (redisClient.expire as jest.Mock).mockResolvedValue(1);
});

async function meRequest(sessionId: string = mockSessionId) {
  const req = request(app).get("/auth/me");
  if (sessionId) {
    req.set("x-session-id", sessionId);
  }
  return req.send();
}

describe("GET /auth/me", () => {

  test("Valid session => 200, returns user profile with customer", async () => {
    const res = await meRequest();

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(buildMeOutput());
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });

  test("Valid ADMIN session => 200, returns admin profile", async () => {
    mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput({
      role: UserRole.ADMIN,
    })));
    mockFindUnique.mockResolvedValue({
      ...buildUserWithCustomer(),
      role: UserRole.ADMIN,
    });

    const res = await meRequest();

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body.role).toBe(UserRole.ADMIN);
  });

  test("Missing x-session-id header => 401", async () => {
    const res = await request(app).get("/auth/me").send();

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  test("Empty x-session-id header => 401", async () => {
    const res = await meRequest("");

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  test("Invalid (non-UUID) x-session-id header => 401", async () => {
    const res = await meRequest("not-a-valid-uuid");

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).not.toHaveBeenCalled();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  test("Session not found in Redis (expired/invalid) => 401", async () => {
    (redisClient.multi as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([null, -2]),
    });

    const res = await meRequest();

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  test("Decrypt throws (corrupted session data) => 401", async () => {
    mockDecrypt.mockImplementation(() => { throw new Error("bad decrypt"); });

    const res = await meRequest();

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  test("User not found in DB (deleted after session created) => 404", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await meRequest();

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });

  test("User with null phone => 200, phone is null in response", async () => {
    mockFindUnique.mockResolvedValue({
      ...buildUserWithCustomer(),
      customer: {
        ...buildUserWithCustomer().customer,
        phone: null,
      },
    });

    const res = await meRequest();

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body.customer.phone).toBeNull();
  });

  test("DB throws unexpected error => 500", async () => {
    mockFindUnique.mockRejectedValue(new Error("DB connection lost"));

    const res = await meRequest();

    expect(res.status).toBe(500);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  // ===== TTL extension tests =====

  test("Session with healthy TTL => 200, no extension triggered", async () => {
    const res = await meRequest();

    expect(res.status).toBe(200);
    expect(redisClient.expire).not.toHaveBeenCalled();
  });

  test("Session with TTL at threshold => 200, session extended", async () => {
    (redisClient.multi as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockEncryptedRedisPayload, EXTENSION_THRESHOLD_SEC]),
    });

    const res = await meRequest();

    expect(res.status).toBe(200);
    expect(redisClient.expire).toHaveBeenCalledWith(mockRedisKey, EXTENSION_AMOUNT_SEC);
  });

  test("Session with TTL below threshold => 200, session extended", async () => {
    (redisClient.multi as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockEncryptedRedisPayload, EXTENSION_THRESHOLD_SEC - 1]),
    });

    const res = await meRequest();

    expect(res.status).toBe(200);
    expect(redisClient.expire).toHaveBeenCalledWith(mockRedisKey, EXTENSION_AMOUNT_SEC);
  });

  test("EXPIRE failure => 200, request still succeeds", async () => {
    (redisClient.multi as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockEncryptedRedisPayload, EXTENSION_THRESHOLD_SEC - 1]),
    });
    (redisClient.expire as jest.Mock).mockRejectedValue(new Error("Redis connection lost"));

    const res = await meRequest();

    expect(res.status).toBe(200);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });
});