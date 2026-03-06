jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn().mockResolvedValue("mock_jwt_token") }
}));
import { redisClient } from "../../../src/redis/redisClient";
jest.mock("jsonwebtoken");
import jwt from "jsonwebtoken";

import * as authMiddleware from "../../../src/auth/authMiddleware";
import { EventCode } from "../../../src/types/eventCodes";
import { UserRole } from "../../../src/generated/enums";
import { mockSessionId } from "../../commonMock";
import { buildJwtPayload } from "../../authMock";

const res: any = {};
const mockedVerify = jwt.verify as jest.Mock;
const mockedRedisGet = redisClient.get as jest.Mock;
const next: jest.Mock = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
  mockedVerify.mockReturnValue(buildJwtPayload());
  mockedRedisGet.mockResolvedValue("mock_jwt_token");
})


describe("requireAuth middleware", () => {
  it("should not throw any errors given valid sessionId", async () => {
    const req: any = { headers: { "x-session-id": mockSessionId } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(req.user).toEqual(buildJwtPayload());
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(mockedVerify).toHaveBeenCalledWith(
      "mock_jwt_token",
      process.env.JWT_SECRET
    );
  });

  it("should not throw any errors given multiple sessionIds", async () => {
    const req: any = { headers: { "x-session-id": [ mockSessionId, "foo" ] }};

    await authMiddleware.requireAuth()(req, res, next);

    expect(req.user).toEqual(buildJwtPayload());
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(mockedVerify).toHaveBeenCalledWith(
      "mock_jwt_token",
      process.env.JWT_SECRET
    );
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
  
  it("should throw 401 given expired token", async () => {
    mockedVerify.mockImplementation(() => {
      const err: any = new Error("Some invalid token error");
      err.name = "jwtError";
      throw err;
    });

    const req: any = { headers: { "x-session-id": mockSessionId } };

    await authMiddleware.requireAuth()(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].code).toBe(EventCode.INVALID_TOKEN);
  });
});

describe("requireRole middleware", () => {
  it("should not throw any errors given sufficient role", async () => {
    const minimumRole: UserRole = UserRole.ADMIN;
    const req: any = { user: { role: UserRole.ADMIN } };

    await authMiddleware.requireRole(minimumRole)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
  it("should throw a ForbiddenError given insufficient role", async () => {
    const minimumRole: UserRole = UserRole.ADMIN;
    const req: any = { user: { role: UserRole.STANDARD } };

    await authMiddleware.requireRole(minimumRole)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].code).toBe(EventCode.FORBIDDEN);
  });
});