
import { requestLoggerMiddleware } from "../../../src/middleware/requestLoggerMiddleware";

jest.mock("../../../src/logging/logger", () => ({
  logger: { info: jest.fn() }
}));
import { logger } from "../../../src/logging/logger";


let req: any;
let res: any;
let next: jest.Mock;
let finishCallback: Function;

beforeEach(() => {
  req = { 
    method: "mockGET", 
    originalUrl: "/mockRequestLoggerTest" 
  };

  next = jest.fn();
  res = { 
    statusCode: 200,
    locals: { traceId: "mock-trace-id" },
    on: jest.fn((_event, callback) => finishCallback = callback),
  };
})

afterEach(() => {
  jest.resetAllMocks();
});

describe("requestLoggerMiddleware", () => {
  it("logs request data on response finish", () => {
    jest.spyOn(process.hrtime, "bigint")
      .mockReturnValueOnce(1_000n)       // start
      .mockReturnValueOnce(2_001_000n);  // end

    requestLoggerMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    finishCallback();

    expect(logger.info).toHaveBeenCalledWith(
      "HTTP request completed",
      {
        traceId: "mock-trace-id",
        method: "mockGET",
        path: "/mockRequestLoggerTest",
        statusCode: 200,
        durationMs: "2.00"
      }
    );
  });
});