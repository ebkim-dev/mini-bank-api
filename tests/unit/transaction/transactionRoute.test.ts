import type { RequestHandler } from "express";

describe("transactionRouter.ts (pure unit)", () => {
  let postMock: jest.Mock;
  let getMock: jest.Mock;

  let mockCreateTransaction: jest.Mock;
  let mockGetTransactions: jest.Mock;
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
    mockGetTransactions = jest.fn();
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
        getTransactions: mockGetTransactions,
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
    const { accountIdParamsSchema, createTransactionBodySchema } =
      require("../../../src/transaction/transactionSchemas");

    expect(requireAuthMock).toHaveBeenCalledTimes(3);
    expect(validateMock).toHaveBeenCalledWith(accountIdParamsSchema, "params");
    expect(validateMock).toHaveBeenCalledWith(createTransactionBodySchema, "body");

    const call = findCall(postMock, "/");
    expect(call).toBeDefined();

    const [path, mw1, mw2, mw3, handler] = call as unknown[];

    expect(path).toBe("/");
    expect(typeof mw1).toBe("function");
    expect(typeof mw2).toBe("function");
    expect(typeof mw3).toBe("function");
    expect(handler).toBe(mockCreateTransaction);
  });

  test("registers GET / with correct middlewares and handler (getTransactions)", () => {
    const { accountIdParamsSchema, getTransactionsQuerySchema } =
      require("../../../src/transaction/transactionSchemas");

    expect(validateMock).toHaveBeenCalledWith(accountIdParamsSchema, "params");
    expect(validateMock).toHaveBeenCalledWith(getTransactionsQuerySchema, "query");

    const call = findCall(getMock, "/");
    expect(call).toBeDefined();

    const [path, mw1, mw2, mw3, handler] = call as unknown[];

    expect(path).toBe("/");
    expect(typeof mw1).toBe("function");
    expect(typeof mw2).toBe("function");
    expect(typeof mw3).toBe("function");
    expect(handler).toBe(mockGetTransactions);
  });

  test("registers GET /:transactionId with correct middlewares and handler (getTransactionById)", () => {
    const { transactionIdParamsSchema } =
      require("../../../src/transaction/transactionSchemas");

    expect(validateMock).toHaveBeenCalledWith(transactionIdParamsSchema, "params");

    const call = findCall(getMock, "/:transactionId");
    expect(call).toBeDefined();

    const [path, mw1, mw2, handler] = call as unknown[];

    expect(path).toBe("/:transactionId");
    expect(typeof mw1).toBe("function");
    expect(typeof mw2).toBe("function");
    expect(handler).toBe(mockGetTransactionById);
  });

  test("registers exactly 3 routes (1 POST, 2 GET) and nothing else", () => {
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledTimes(2);

    const postPaths = postMock.mock.calls.map((call: unknown[]) => call[0]);
    const getPaths = getMock.mock.calls.map((call: unknown[]) => call[0]);

    expect(postPaths).toEqual(["/"]);
    expect(getPaths).toEqual(["/", "/:transactionId"]);
  });
});