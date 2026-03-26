const mockExec = jest.fn();
const mockExpire = jest.fn();

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: {
    multi: jest.fn(() => ({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: mockExec,
    })),
    expire: mockExpire,
  }
}));

import { redisClient } from "../../../src/redis/redisClient";
import * as authMiddleware from "../../../src/auth/authMiddleware";
import { EventCode } from "../../../src/types/eventCodes";
import { mockRedisKey, mockSessionId } from "../../commonMock";
import { buildAuthInput } from "../../authMock";
import { encrypt } from "../../../src/utils/encryption";
import {
  EXTENSION_THRESHOLD_SEC,
  EXTENSION_AMOUNT_SEC,
} from "../../../src/auth/authService";

const res: any = {};
const next: jest.Mock = jest.fn();
const encryptedPayload = encrypt(JSON.stringify(buildAuthInput()));
const healthyTtl = EXTENSION_THRESHOLD_SEC + 1;

beforeEach(() => {
  jest.resetAllMocks();
  (redisClient.multi as jest.Mock).mockReturnValue({
    get: jest.fn().mockReturnThis(),
    ttl: jest.fn().mockReturnThis(),
    exec: mockExec,
  });
  mockExec.mockResolvedValue([encryptedPayload, healthyTtl]);
  mockExpire.mockResolvedValue(1);
});

describe("requireAuth middleware", () => {
  it("should not throw any errors given valid sessionId", async () => {
    const req: any = { headers: { "x-session-id": mockSessionId } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(req.user).toEqual(buildAuthInput());
    expect(req.sessionId).toBe(mockSessionId);
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("should not throw any errors given multiple sessionIds", async () => {
    const req: any = { headers: { "x-session-id": [mockSessionId, "foo"] } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(req.user).toEqual(buildAuthInput());
    expect(req.sessionId).toBe(mockSessionId);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("should throw 401 given missing sessionId", async () => {
    const req: any = { headers: { "x-session-id": undefined } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].code).toBe(EventCode.INVALID_TOKEN);
  });

  it("should throw 401 given invalid header", async () => {
    const req: any = { headers: { "x-session-id": "not_uuid" } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].code).toBe(EventCode.INVALID_TOKEN);
  });

  it("should throw 401 if redis GET fails to retrieve token", async () => {
    mockExec.mockResolvedValue([null, -2]);
    const req: any = { headers: { "x-session-id": mockSessionId } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].code).toBe(EventCode.INVALID_TOKEN);
  });

  it("should call next with UnauthorizedError if JSON.parse throws", async () => {
    const req: any = { headers: { "x-session-id": mockSessionId } };

    const spy = jest.spyOn(JSON, "parse").mockImplementation(() => {
      throw new Error("invalid JSON");
    });

    await authMiddleware.requireAuth()(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].code).toBe(EventCode.INVALID_TOKEN);

    spy.mockRestore();
  });

  // ===== pipeline tests =====

  it("should call pipeline with correct Redis key for both GET and TTL", async () => {
    const req: any = { headers: { "x-session-id": mockSessionId } };

    await authMiddleware.requireAuth()(req, res, next);

    const chain = (redisClient.multi as jest.Mock).mock.results[0]?.value;
    expect(chain.get).toHaveBeenCalledWith(mockRedisKey);
    expect(chain.ttl).toHaveBeenCalledWith(mockRedisKey);
    expect(next).toHaveBeenCalledWith();
  });

  // ===== TTL extension tests =====

  it("should not extend session when TTL is above threshold", async () => {
    mockExec.mockResolvedValue([encryptedPayload, healthyTtl]);
    const req: any = { headers: { "x-session-id": mockSessionId } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(mockExpire).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("should extend session when TTL is exactly at threshold", async () => {
    mockExec.mockResolvedValue([encryptedPayload, EXTENSION_THRESHOLD_SEC]);
    const req: any = { headers: { "x-session-id": mockSessionId } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(mockExpire).toHaveBeenCalledWith(mockRedisKey, EXTENSION_AMOUNT_SEC);
    expect(next).toHaveBeenCalledWith();
  });

  it("should extend session when TTL is below threshold", async () => {
    mockExec.mockResolvedValue([encryptedPayload, EXTENSION_THRESHOLD_SEC - 1]);
    const req: any = { headers: { "x-session-id": mockSessionId } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(mockExpire).toHaveBeenCalledWith(mockRedisKey, EXTENSION_AMOUNT_SEC);
    expect(next).toHaveBeenCalledWith();
  });

  it("should extend session when TTL is 1 second remaining", async () => {
    mockExec.mockResolvedValue([encryptedPayload, 1]);
    const req: any = { headers: { "x-session-id": mockSessionId } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(mockExpire).toHaveBeenCalledWith(mockRedisKey, EXTENSION_AMOUNT_SEC);
    expect(next).toHaveBeenCalledWith();
  });

  it("should not extend session when TTL is -1 (no expiry set)", async () => {
    mockExec.mockResolvedValue([encryptedPayload, -1]);
    const req: any = { headers: { "x-session-id": mockSessionId } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(mockExpire).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("should not extend session when TTL is -2 (key gone race condition)", async () => {
    mockExec.mockResolvedValue([encryptedPayload, -2]);
    const req: any = { headers: { "x-session-id": mockSessionId } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(mockExpire).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("should still call next() if EXPIRE throws — extension failure is non-fatal", async () => {
    mockExec.mockResolvedValue([encryptedPayload, EXTENSION_THRESHOLD_SEC - 1]);
    mockExpire.mockRejectedValue(new Error("Redis connection lost"));
    const req: any = { headers: { "x-session-id": mockSessionId } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(mockExpire).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});