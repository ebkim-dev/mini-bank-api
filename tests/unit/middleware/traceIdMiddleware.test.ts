import { traceIdMiddleware } from "../../../src/middleware/traceIdMiddleware";

jest.mock("crypto", () => ({
  randomUUID: jest.fn(),
}));
import { randomUUID } from "crypto";

const req: any = {};
const setHeader = jest.fn();
let res: any;
let next: jest.Mock;

beforeEach(() => {
  next = jest.fn();
  res = { 
    locals: {},
    setHeader
  };
})

afterEach(() => {
  jest.resetAllMocks();
});

describe("traceIdMiddleware", () => {
  it("should generate a traceId using randomUUID when available", async () => {
    (randomUUID as jest.Mock).mockReturnValue("mock-uuid");
    traceIdMiddleware(req, res, next);

    expect(res.locals.traceId).toBe("mock-uuid");
    expect(setHeader).toHaveBeenCalledWith("X-Trace-Id", "mock-uuid");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should generate a fallback traceId when randomUUID is not available", async () => {
    (randomUUID as unknown) = undefined;
    traceIdMiddleware(req, res, next);

    expect(res.locals.traceId).toMatch(/^trace-/);
    expect(setHeader).toHaveBeenCalledWith(
      "X-Trace-Id",
      res.locals.traceId
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});