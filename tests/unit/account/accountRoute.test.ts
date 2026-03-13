import type { RequestHandler } from "express";

describe("accountRouter.ts (pure unit)", () => {
  let postMock: jest.Mock;
  let getMock: jest.Mock;
  let putMock: jest.Mock;

  let mockCreateAccount: jest.Mock;
  let mockGetAccountsByCustomerId: jest.Mock;
  let mockGetAccount: jest.Mock;
  let mockUpdateAccount: jest.Mock;
  let mockDeleteAccount: jest.Mock;
  let mockGetAccountSummary: jest.Mock;
  let mockGetTransactions: jest.Mock;

  let requireAuthMock: jest.Mock;
  let requireRoleMock: jest.Mock;
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
    putMock = jest.fn();

    mockCreateAccount = jest.fn();
    mockGetAccountsByCustomerId = jest.fn();
    mockGetAccount = jest.fn();
    mockUpdateAccount = jest.fn();
    mockDeleteAccount = jest.fn();
    mockGetAccountSummary = jest.fn();
    mockGetTransactions = jest.fn();

    requireAuthMock = jest.fn(() => makeMw("requireAuth"));
    requireRoleMock = jest.fn((_role: unknown) => makeMw("requireRole"));
    validateMock = jest.fn((_schema: unknown, _source: unknown) =>
      makeMw("validate")
    );

    jest.doMock("express", () => {
      return {
        Router: () => ({
          post: postMock,
          get: getMock,
          put: putMock,
        }),
      };
    });

    jest.doMock("../../../src/account/accountController", () => {
      return {
        createAccount: mockCreateAccount,
        getAccountsByCustomerId: mockGetAccountsByCustomerId,
        getAccount: mockGetAccount,
        updateAccount: mockUpdateAccount,
        deleteAccount: mockDeleteAccount,
        getAccountSummary: mockGetAccountSummary,
      };
    });

    jest.doMock("../../../src/transaction/transactionController", () => {
      return {
        getTransactions: mockGetTransactions,
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
        requireRole: requireRoleMock,
      };
    });

    require("../../../src/account/accountRouter");
  });

  const findCall = (mockFn: jest.Mock, path: string) => {
    return mockFn.mock.calls.find((c: any[]) => c[0] === path);
  };

  test("registers POST / with correct middlewares and handler (createAccount)", () => {
    const { createAccountBodySchema } = require("../../../src/account/accountSchemas");

    expect(validateMock).toHaveBeenCalledWith(createAccountBodySchema, "body");
    expect(requireAuthMock).toHaveBeenCalledTimes(7);

    const call = findCall(postMock, "/");
    expect(call).toBeDefined();

    const [path, mw1, mw2, handler] = call as any[];

    expect(path).toBe("/");
    expect(typeof mw1).toBe("function");
    expect(typeof mw2).toBe("function");
    expect(handler).toBe(mockCreateAccount);

    expect(mw1).toBe(requireAuthMock.mock.results[0]!.value);
    expect(mw2).toBe(validateMock.mock.results[0]!.value);
  });

  test("registers GET / with correct middlewares and handler (getAccountsByCustomerId)", () => {
    const call = findCall(getMock, "/");
    expect(call).toBeDefined();

    const [path, mw1, handler] = call as any[];

    expect(path).toBe("/");
    expect(typeof mw1).toBe("function");
    expect(handler).toBe(mockGetAccountsByCustomerId);
  });

  test("registers GET /:id with correct middlewares and handler (getAccount)", () => {

    const { accountIdParamsSchema } = require("../../../src/account/accountSchemas");

    expect(validateMock).toHaveBeenCalledWith(accountIdParamsSchema, "params");

    const call = findCall(getMock, "/:id");
    expect(call).toBeDefined();

    const [path, mw1, mw2, handler] = call as any[];

    expect(path).toBe("/:id");
    expect(typeof mw1).toBe("function");
    expect(typeof mw2).toBe("function");
    expect(handler).toBe(mockGetAccount);
  });

  test("registers GET /:id/summary with correct middlewares and handler (getAccountSummary)", () => {
    const { accountIdParamsSchema } = require("../../../src/account/accountSchemas");

    expect(validateMock).toHaveBeenCalledWith(accountIdParamsSchema, "params");

    const call = findCall(getMock, "/:id/summary");
    expect(call).toBeDefined();

    const [path, mw1, mw2, handler] = call as any[];

    expect(path).toBe("/:id/summary");
    expect(typeof mw1).toBe("function");
    expect(typeof mw2).toBe("function");
    expect(handler).toBe(mockGetAccountSummary);
  });

  test("registers GET /:id/transactions with correct middlewares and handler (getTransactions)", () => {
    const { accountIdParamsSchema } = require("../../../src/account/accountSchemas");
    const { getTransactionsQuerySchema } = require("../../../src/transaction/transactionSchemas");

    expect(validateMock).toHaveBeenCalledWith(accountIdParamsSchema, "params");
    expect(validateMock).toHaveBeenCalledWith(getTransactionsQuerySchema, "query");

    const call = findCall(getMock, "/:id/transactions");
    expect(call).toBeDefined();

    const [path, mw1, mw2, mw3, handler] = call as any[];

    expect(path).toBe("/:id/transactions");
    expect(typeof mw1).toBe("function");
    expect(typeof mw2).toBe("function");
    expect(typeof mw3).toBe("function");
    expect(handler).toBe(mockGetTransactions);
  });

  test("registers PUT /:id with correct middlewares and handler (updateAccount)", () => {
    const { accountIdParamsSchema, updateAccountBodySchema } = require("../../../src/account/accountSchemas");

    expect(validateMock).toHaveBeenCalledWith(accountIdParamsSchema, "params");
    expect(validateMock).toHaveBeenCalledWith(updateAccountBodySchema, "body");

    const call = findCall(putMock, "/:id");
    expect(call).toBeDefined();

    const [path, mw1, mw2, mw3, handler] = call as any[];

    expect(path).toBe("/:id");
    expect(typeof mw1).toBe("function");
    expect(typeof mw2).toBe("function");
    expect(typeof mw3).toBe("function");
    expect(handler).toBe(mockUpdateAccount);
  });

  test("registers POST /:id/close with correct middlewares and handler (deleteAccount)", () => {
    const { accountIdParamsSchema } = require("../../../src/account/accountSchemas");

    expect(validateMock).toHaveBeenCalledWith(accountIdParamsSchema, "params");

    const call = findCall(postMock, "/:id/close");
    expect(call).toBeDefined();

    const [path, mw1, mw2, handler] = call as any[];

    expect(path).toBe("/:id/close");
    expect(typeof mw1).toBe("function");
    expect(typeof mw2).toBe("function");
    expect(handler).toBe(mockDeleteAccount);
  });

  test("registers exactly 7 routes (2 POST, 4 GET, 1 PUT) and nothing else", () => {
    expect(postMock).toHaveBeenCalledTimes(2); 
    expect(getMock).toHaveBeenCalledTimes(4);  
    expect(putMock).toHaveBeenCalledTimes(1);

    const postPaths = postMock.mock.calls.map((c: any[]) => c[0]);
    const getPaths = getMock.mock.calls.map((c: any[]) => c[0]);
    const putPaths = putMock.mock.calls.map((c: any[]) => c[0]);

    expect(postPaths).toEqual(expect.arrayContaining(["/", "/:id/close"]));
    expect(getPaths).toEqual(expect.arrayContaining(["/", "/:id", "/:id/summary", "/:id/transactions"]));
    expect(putPaths).toEqual(["/:id"]);
  });
});