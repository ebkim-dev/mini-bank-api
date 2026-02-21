
import * as authMiddleware from "../../src/auth/authMiddleware";
import jwt from "jsonwebtoken";
import { ErrorCode } from "../../src/types/errorCodes";
import { UnauthorizedError } from "../../src/error/error";

jest.mock("jsonwebtoken");

// let next: jest.Mock;
// let res: any;

beforeEach(() => {
  // next = jest.fn();
  // res = {};
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe("requireAuth middleware", () => {
  it("should not throw any errors given valid and fresh JWT", async () => {
    const mockedToken = {
      userId: "123",
      role: "ADMIN"
    };

    const mockedVerify = jwt.verify as jest.Mock;
    mockedVerify.mockImplementation(() => (mockedToken));

    const req: any = {
      headers: {
        authorization: "Bearer my_token_blahblahblahblah"
      }
    };

    const res: any = {};
    const next = jest.fn();

    const middleware = authMiddleware.requireAuth();
    await middleware(req, res, next);

    expect(req.user).toEqual(mockedToken);
    expect(next).toHaveBeenCalledTimes(1);
  });
  
  it("should throw 401 given missing header", async () => {
    const mockedToken = {
      userId: "123",
      role: "ADMIN"
    };

    const mockedVerify = jwt.verify as jest.Mock;
    mockedVerify.mockImplementation(() => (mockedToken));

    const req: any = {
      headers: {
        authorization: undefined
      }
    };

    const res: any = {};
    const next = jest.fn();

    const middleware = authMiddleware.requireAuth();
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const calledWith = next.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Error);
    expect(calledWith.code).toBe(ErrorCode.INVALID_TOKEN);
  });
  
  it("should throw 401 given invalid header", async () => {
    const mockedToken = {
      userId: "123",
      role: "ADMIN"
    };

    const mockedVerify = jwt.verify as jest.Mock;
    mockedVerify.mockImplementation(() => (mockedToken));

    const req: any = {
      headers: {
        authorization: "NOTBEARER my_token_blahblahblahblah"
      }
    };

    const res: any = {};
    const next = jest.fn();

    const middleware = authMiddleware.requireAuth();
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const calledWith = next.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Error);
    expect(calledWith.code).toBe(ErrorCode.INVALID_TOKEN);
  });
  
  it("should throw 401 given missing token", async () => {
    const mockedToken = {
      userId: "123",
      role: "ADMIN"
    };

    const mockedVerify = jwt.verify as jest.Mock;
    mockedVerify.mockImplementation(() => (mockedToken));

    const req: any = {
      headers: {
        authorization: "BEARER"
      }
    };

    const res: any = {};
    const next = jest.fn();

    const middleware = authMiddleware.requireAuth();
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const calledWith = next.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Error);
    expect(calledWith.code).toBe(ErrorCode.INVALID_TOKEN);
  });
  
  it("should throw 401 given expired token", async () => {
    const mockedToken = {
      userId: "123",
      role: "ADMIN"
    };

    const mockedVerify = jwt.verify as jest.Mock;
    mockedVerify.mockImplementation(() => {
      throw UnauthorizedError(ErrorCode.INVALID_TOKEN, "jwt expired");
    });

    const req: any = {
      headers: {
        authorization: "BEARER my_token_blahblahblahblah"
      }
    };

    const res: any = {};
    const next = jest.fn();

    const middleware = authMiddleware.requireAuth();
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const calledWith = next.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Error);
    expect(calledWith.code).toBe(ErrorCode.INVALID_TOKEN);
  });
});