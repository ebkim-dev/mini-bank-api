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
  mockMissingUserId,
} from "../../commonMock";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn() }
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

const mockRedisGet = redisClient.get as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;
const mockFindUnique = prismaClient.user.findUnique as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRedisGet.mockResolvedValue(mockEncryptedRedisPayload);
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
  mockFindUnique.mockResolvedValue(buildUserWithCustomer());
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
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
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
    expect(redisClient.get).not.toHaveBeenCalled();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  test("Session not found in Redis (expired/invalid) => 401", async () => {
    mockRedisGet.mockResolvedValue(null);

    const res = await meRequest();

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
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
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
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
});