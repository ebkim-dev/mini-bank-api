import type { RequestHandler } from "express";

describe("transactionRouter.ts (pure unit)", () => {
  let postMock: jest.Mock;
  let getMock: jest.Mock;

  let mockCreateTransaction: jest.Mock;
  let mockGetTransactionById: jest.Mock;

  let requireAuthMock: jest.Mock;
  let validateMock: jest.Mock;

  const makeMw = (name: string): RequestHandler => {
    const mw: RequestHandler = (_req, _res, next) => next();
    (mw as any)._mwName = name;
    return mw;
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    postMock = jest.fn();
    getMock = jest.fn();

    mockCreateTransaction = jest.fn();
    mockGetTransactionById = jest.fn();

    requireAuthMock = jest.fn(() => makeMw("requireAuth"));
    validateMock = jest.fn((_schema: unknown, _source: unknown) =>
      makeMw("validate")
    );

    jest.doMock("express", () => {
      return {
        Router: () => ({
          post: postMock,
          get: getMock,
        }),
      };
    });

    jest.doMock("../../../src/transaction/transactionController", () => {
      return {
        createTransaction: mockCreateTransaction,
        getTransactionById: mockGetTransactionById,
      };
    });

    jest.doMock("../../../src/middleware/validationMiddleware", () => {
      return {
        validate: validateMock,
      };
    });

    jest.doMock("../../../src/auth/authMiddleware", () => {
      return {
        requireAuth: requireAuthMock,
      };
    });

    require("../../../src/transaction/transactionRouter");
  });

  const findCall = (mockFn: jest.Mock, path: string) => {
    return mockFn.mock.calls.find((call: unknown[]) => call[0] === path);
  };

  test("registers POST / with correct middlewares and handler (createTransaction)", () => {
    const { createTransactionBodySchema } = require("../../../src/transaction/transactionSchemas");

    expect(requireAuthMock).toHaveBeenCalledTimes(2);
    expect(validateMock).toHaveBeenCalledWith(createTransactionBodySchema, "body");

    const call = findCall(postMock, "/");
    expect(call).toBeDefined();

    const [path, mw1, mw2, handler] = call as unknown[];

    expect(path).toBe("/");
    expect(typeof mw1).toBe("function");
    expect(typeof mw2).toBe("function");
    expect(handler).toBe(mockCreateTransaction);

    expect(mw1).toBe(requireAuthMock.mock.results[0]!.value);
    expect(mw2).toBe(validateMock.mock.results[0]!.value);
  });

  test("registers GET /:id with correct middlewares and handler (getTransactionById)", () => {
    const { transactionIdParamsSchema } = require("../../../src/transaction/transactionSchemas");

    expect(validateMock).toHaveBeenCalledWith(transactionIdParamsSchema, "params");

    const call = findCall(getMock, "/:id");
    expect(call).toBeDefined();

    const [path, mw1, mw2, handler] = call as unknown[];

    expect(path).toBe("/:id");
    expect(typeof mw1).toBe("function");
    expect(typeof mw2).toBe("function");
    expect(handler).toBe(mockGetTransactionById);

    expect(mw1).toBe(requireAuthMock.mock.results[1]!.value);
    expect(mw2).toBe(validateMock.mock.results[1]!.value);
  });

  test("registers exactly 2 routes (1 POST, 1 GET) and nothing else", () => {
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledTimes(1);

    const postPaths = postMock.mock.calls.map((call: unknown[]) => call[0]);
    const getPaths = getMock.mock.calls.map((call: unknown[]) => call[0]);

    expect(postPaths).toEqual(["/"]);
    expect(getPaths).toEqual(["/:id"]);
  });

  test("uses the middleware returned by requireAuth() and validate() for each route", () => {
    const postCall = findCall(postMock, "/");
    const getCall = findCall(getMock, "/:id");

    expect(postCall).toBeDefined();
    expect(getCall).toBeDefined();

    expect(requireAuthMock).toHaveBeenCalledTimes(2);
    expect(validateMock).toHaveBeenCalledTimes(2);

    const firstAuthMw = requireAuthMock.mock.results[0]!.value;
    const secondAuthMw = requireAuthMock.mock.results[1]!.value;

    const firstValidateMw = validateMock.mock.results[0]!.value;
    const secondValidateMw = validateMock.mock.results[1]!.value;

    expect(postCall![1]).toBe(firstAuthMw);
    expect(postCall![2]).toBe(firstValidateMw);

    expect(getCall![1]).toBe(secondAuthMw);
    expect(getCall![2]).toBe(secondValidateMw);
  });
});