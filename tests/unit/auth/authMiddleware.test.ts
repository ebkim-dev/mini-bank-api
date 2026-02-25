
import * as authMiddleware from "../../../src/auth/authMiddleware";
import jwt from "jsonwebtoken";
import { ErrorCode } from "../../../src/types/errorCodes";
import { UserRole } from "../../../src/generated/enums";
import { JwtPayload } from "../../../src/auth/user";
import { JWT_EXPIRES_IN } from "../../../src/auth/authService";

jest.mock("jsonwebtoken");

const res: any = {};
const mockedVerify = jwt.verify as jest.Mock;

const now = Date.now();
const mockedJwtPayload: JwtPayload = {
  sub: "123",
  role: UserRole.ADMIN,
  iat: now,
  exp: now + JWT_EXPIRES_IN,
};

let next: jest.Mock;
beforeEach(() => {
  next = jest.fn();
  mockedVerify.mockImplementation(() => (mockedJwtPayload));
})

afterEach(() => {
  jest.resetAllMocks();
});

describe("requireAuth middleware", () => {
  it("should not throw any errors given valid and fresh JWT", async () => {
    const req: any = { headers: {
      authorization: "Bearer my_token_blahblahblahblah"
    }};

    const middleware = authMiddleware.requireAuth();
    await middleware(req, res, next);

    expect(req.user).toEqual(mockedJwtPayload);
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockedVerify).toHaveBeenCalledWith(
      "my_token_blahblahblahblah",
      process.env.JWT_SECRET
    );
  });
  
  it("should throw 401 given missing header", async () => {
    const req: any = { headers: {
      authorization: undefined
    }};

    const middleware = authMiddleware.requireAuth();
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const calledWith = next.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Error);
    expect(calledWith.code).toBe(ErrorCode.INVALID_TOKEN);
  });
  
  it("should throw 401 given invalid header", async () => {
    const req: any = { headers: {
      authorization: "NOTBEARER my_token_blahblahblahblah"
    }};

    const middleware = authMiddleware.requireAuth();
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const calledWith = next.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Error);
    expect(calledWith.code).toBe(ErrorCode.INVALID_TOKEN);
  });
  
  it("should throw 401 given missing token", async () => {
    const req: any = { headers: {
      authorization: "Bearer"
    }};

    const middleware = authMiddleware.requireAuth();
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const calledWith = next.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Error);
    expect(calledWith.code).toBe(ErrorCode.INVALID_TOKEN);
  });
  
  it("should throw 401 given expired token", async () => {
    mockedVerify.mockImplementation(() => {
      const err: any = new Error("Some invalid token error");
      err.name = "jwtError";
      throw err;
    });

    const req: any = { headers: { 
      authorization: "Bearer my_token_blahblahblahblah"
    }};

    const middleware = authMiddleware.requireAuth();
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const calledWith = next.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Error);
    expect(calledWith.code).toBe(ErrorCode.INVALID_TOKEN);
  });
});

describe("requireRole middleware", () => {
  it("should not throw any errors given sufficient role", async () => {
    const minimumRole: UserRole = UserRole.ADMIN;
    const req: any = { user: { role: UserRole.ADMIN } };

    const middleware = authMiddleware.requireRole(minimumRole);
    await middleware(req, res, next);

    expect(req.user.role).toEqual(minimumRole);
    expect(next).toHaveBeenCalledTimes(1);
  });
  it("should throw a ForbiddenError given insufficient role", async () => {
    const minimumRole: UserRole = UserRole.ADMIN;
    const req: any = { user: { role: UserRole.STANDARD } };

    const middleware = authMiddleware.requireRole(minimumRole);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const calledWith = next.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Error);
    expect(calledWith.code).toBe(ErrorCode.FORBIDDEN);
  });
});