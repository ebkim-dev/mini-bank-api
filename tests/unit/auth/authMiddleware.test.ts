jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn() }
}));
import { redisClient } from "../../../src/redis/redisClient";

import * as authMiddleware from "../../../src/auth/authMiddleware";
import { EventCode } from "../../../src/types/eventCodes";
import { mockRedisKey, mockSessionId } from "../../commonMock";
import { buildAuthInput } from "../../authMock";
import { encrypt } from "../../../src/utils/encryption";

const res: any = {};
const mockedRedisGet = redisClient.get as jest.Mock;
const next: jest.Mock = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
  mockedRedisGet.mockResolvedValue(
    encrypt(JSON.stringify(buildAuthInput()))
  );
})

describe("requireAuth middleware", () => {
  it("should not throw any errors given valid sessionId", async () => {
    const req: any = { headers: { "x-session-id": mockSessionId } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(req.user).toEqual(buildAuthInput());
    expect(req.sessionId).toBe(mockSessionId);
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("should not throw any errors given multiple sessionIds", async () => {
    const req: any = { headers: { "x-session-id": [ mockSessionId, "foo" ] }};

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
    (redisClient.get as jest.Mock).mockResolvedValue(null);
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
});