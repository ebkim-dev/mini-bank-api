import { z } from "zod";
import { validate } from "../../../src/middleware/validationMiddleware";
import { AppError } from "../../../src/error/error";
import { ErrorCode } from "../../../src/types/errorCodes";

describe("validationMiddleware.validate", () => {
  function makeReq(overrides?: Partial<any>) {
    return {
      body: {},
      query: {},
      params: {},
      user: {},
      ...overrides,
    } as any;
  }

  const res = {} as any;

  test("success: parses source and stores into req.validated[source], then calls next()", () => {
    const schema = z.object({
      amount: z.number(),
    });

    const req = makeReq({ body: { amount: 100 } });
    const next = jest.fn();

    const middleware = validate(schema, "body");
    middleware(req, res, next);

    expect(req.validated).toBeDefined();
    expect(req.validated.body).toEqual({ amount: 100 });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  test("success: does not overwrite existing req.validated", () => {
    const schema = z.object({
      amount: z.number(),
    });

    const req = makeReq({
      body: { amount: 50 },
      validated: { query: { page: 1 } }, 
    });

    const next = jest.fn();

    const middleware = validate(schema, "body");
    middleware(req, res, next);

    expect(req.validated.query).toEqual({ page: 1 });
    expect(req.validated.body).toEqual({ amount: 50 });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  test("ZodError: calls next(BadRequestError) with formatted issues", () => {
    const schema = z.object({
      amount: z.number(),
    });
    
    const req = makeReq({ body: {} });
    const next = jest.fn();

    const middleware = validate(schema, "body");
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const errArg = next.mock.calls[0][0];
    expect(errArg).toBeInstanceOf(AppError);

    const appErr = errArg as AppError;
    expect(appErr.statusCode).toBe(400);
    expect(appErr.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(appErr.message).toBe("Validation failed");
    
    expect(appErr.details).toBeDefined();
    const details = appErr.details as any;

    expect(Array.isArray(details.issues)).toBe(true);
    expect(details.issues.length).toBeGreaterThan(0);

    expect(details.issues[0]).toHaveProperty("path");
    expect(details.issues[0]).toHaveProperty("message");
    expect(details.issues[0]).toHaveProperty("code");
  });

  test("non-Zod error: passes the original error to next(err)", () => {
    const schema: any = {
      parse: () => {
        throw new Error("newError");
      },
    };

    const req = makeReq({ body: { any: "thing" } });
    const next = jest.fn();

    const middleware = validate(schema, "body");
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const errArg = next.mock.calls[0][0];
    expect(errArg).toBeInstanceOf(Error);
    expect((errArg as Error).message).toBe("newError");
  });
});