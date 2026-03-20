import type { RequestHandler } from "express";

describe("app.ts - createApp", () => {
  const ORIGINAL_ENV = process.env;

  let appUseMock: jest.Mock;
  let mockApp: { use: jest.Mock };
  let mockExpress: any;
  
  // Express mocks
  let expressJsonMock: jest.Mock;
  let jsonMw: RequestHandler;

  const traceIdMw: RequestHandler = (_req, _res, next) => next();
  const requestLoggerMw: RequestHandler = (_req, _res, next) => next();
  const notFoundHandlerMw: RequestHandler = (_req, _res, next) => next();
  const errorHandlerMw: any = (_err: any, _req: any, _res: any, _next: any) => {};

  const healthRouterMock: any = { _router: "health" };
  const accountRouterMock: any = { _router: "accounts" };
  const transferRouterMock: any = { _router: "transfers" };
  const authRouterMock: any = { _router: "auth" };
  const transactionRouterMock: any = { _router: "transactions" };

  const swaggerSpecMock: any = { openapi: "3.0.0" };
  const swaggerServeMw: RequestHandler = (_req, _res, next) => next();
  const swaggerSetupMw: RequestHandler = (_req, _res, next) => next();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };

    appUseMock = jest.fn();
    mockApp = { use: appUseMock };

    jsonMw = (_req, _res, next) => next();
    expressJsonMock = jest.fn(() => jsonMw);

    jest.doMock("express", () => {
        mockExpress = jest.fn(() => mockApp);
        mockExpress.json = expressJsonMock;
        return {
          __esModule: true,
          default: mockExpress,
        };
    });

    jest.doMock("../../src/middleware/traceIdMiddleware", () => {
      return { traceIdMiddleware: traceIdMw };
    });

    jest.doMock("../../src/middleware/requestLoggerMiddleware", () => {
      return { requestLoggerMiddleware: requestLoggerMw };
    });

    jest.doMock("../../src/middleware/errorHandler", () => {
      return {
        notFoundHandler: notFoundHandlerMw,
        errorHandler: errorHandlerMw,
      };
    });

    jest.doMock("../../src/health/healthRouter", () => ({
      __esModule: true,
      default: healthRouterMock,
    }));

    jest.doMock("../../src/account/accountRouter", () => ({
      __esModule: true,
      default: accountRouterMock,
    }));

    jest.doMock("../../src/transfer/transferRouter", () => ({
      __esModule: true,
      default: transferRouterMock,
    }));

    jest.doMock("../../src/auth/authRouter", () => ({
      __esModule: true,
      default: authRouterMock,
    }));

    jest.doMock("../../src/transaction/transactionRouter", () => ({
      __esModule: true,
      default: transactionRouterMock,
    }));

    // 4) Mock swagger
    jest.doMock("swagger-ui-express", () => {
      return {
        __esModule: true,
        default: {
          serve: swaggerServeMw,
          setup: jest.fn(() => swaggerSetupMw),
        },
      };
    });

    jest.doMock("../../src/config/swagger", () => {
      return { swaggerSpec: swaggerSpecMock };
    });
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test("throws if ENCRYPTION_KEY env variable is missing", () => {
    delete process.env.ENCRYPTION_KEY;
    const { createApp } = require("../../src/app");

    expect(() => createApp()).toThrow("ENCRYPTION_KEY is not defined");
  });

  test("creates app and wires all middleware/routes in correct order", () => {
    process.env.ENCRYPTION_KEY = "test-encryption-key";

    const { createApp } = require("../../src/app");
    const app = createApp();

    expect(app).toBe(mockApp);
    expect(mockExpress).toHaveBeenCalledTimes(1);
    expect(expressJsonMock).toHaveBeenCalledTimes(1);

    const swaggerUi = require("swagger-ui-express").default;
    expect(swaggerUi.setup).toHaveBeenCalledWith(swaggerSpecMock);

    const calls = appUseMock.mock.calls;
    expect(calls).toEqual([
      [jsonMw],
      [traceIdMw],
      [requestLoggerMw],
      ["/auth", authRouterMock],
      ["/health", healthRouterMock],
      ["/accounts", accountRouterMock],
      ["/accounts/:accountId/transactions", transactionRouterMock],
      ["/accounts/:accountId/transfers", transferRouterMock],
      ["/docs", swaggerServeMw, swaggerSetupMw],
      [notFoundHandlerMw],
      [errorHandlerMw],
    ]);
  });
});