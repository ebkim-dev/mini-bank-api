
import * as errorHandlers from "../../../src/middleware/errorHandler";
import { ErrorCode } from "../../../src/types/errorCodes";
import { AppError } from "../../../src/error/error";

jest.mock("../../../src/logging/logger", () => ({
  logger: { error: jest.fn() }
}));
import { logger } from "../../../src/logging/logger";


let req: any;
let res: any;
let jsonMock: jest.Mock;
let statusMock: jest.Mock;
let next: jest.Mock;

beforeEach(() => {
  req = { 
    method: "mockGET", 
    originalUrl: "/mockUnitTest" 
  };

  next = jest.fn();
  jsonMock = jest.fn();
  statusMock = jest.fn(() => ({ json: jsonMock }));
  res = { 
    status: statusMock,
    locals: { traceId: "mock-trace-id" },
  };
})

afterEach(() => {
  jest.resetAllMocks();
});

describe("notFoundHandler", () => {
  it("should call next and pass a NotFoundError", async () => {
    errorHandlers.notFoundHandler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const passedError = (next as jest.Mock).mock.calls[0][0];
    expect(passedError).toBeInstanceOf(Error);
    expect(passedError.message).toBe(
      "Route mockGET /mockUnitTest not found"
    );
  });
});

describe("errorHandler", () => {
  it("should set appropriate code and response given AppError", async() => {
    const err: AppError = new AppError(999, "TEST_ERROR", "Test error");
    errorHandlers.errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      expect.any(AppError),
      expect.objectContaining({
        traceId: "mock-trace-id",
        method: req.method,
        path: req.originalUrl,
      }),
    );
    expect(statusMock).toHaveBeenCalledWith(999);
    expect(jsonMock).toHaveBeenCalledWith({
      traceId: "mock-trace-id",
      code: err.code,
      message: err.message
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  it("should set appropriate code and response given non-AppError", async() => {
    const err: number = 42;
    errorHandlers.errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      expect.any(AppError),
      expect.objectContaining({
        traceId: "mock-trace-id",
        method: req.method,
        path: req.originalUrl,
      }),
    );
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      traceId: "mock-trace-id",
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Unexpected error occurred",
      details: { originalError: err }
    });
    expect(next).not.toHaveBeenCalled();
  });
})