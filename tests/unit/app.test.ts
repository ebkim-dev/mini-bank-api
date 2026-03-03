import type { RequestHandler } from "express";

describe("app.ts - createApp", () => {
  const ORIGINAL_ENV = process.env;

  let appUseMock: jest.Mock;
  let mockApp: { use: jest.Mock };
  let mockExpress: any ;
  
  // Express mocks
  let expressDefaultMock: jest.Mock;
  let expressJsonMock: jest.Mock;
  let jsonMw: RequestHandler;

  // Middleware/routers mocks
  const traceIdMw: RequestHandler = (_req, _res, next) => next();
  const requestLoggerMw: RequestHandler = (_req, _res, next) => next();
  const notFoundHandlerMw: RequestHandler = (_req, _res, next) => next();
  const errorHandlerMw: any = (_err: any, _req: any, _res: any, _next: any) => {};

  const healthRouterMock: any = { _router: "health" };
  const accountRouterMock: any = { _router: "accounts" };
  const authRouterMock: any = { _router: "auth" };

  // Swagger mocks
  const swaggerSpecMock: any = { openapi: "3.0.0" };
  const swaggerServeMw: RequestHandler = (_req, _res, next) => next();
  const swaggerSetupMw: RequestHandler = (_req, _res, next) => next();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };

    // App mock
    appUseMock = jest.fn();
    mockApp = { use: appUseMock };

    // express mocks
    jsonMw = (_req, _res, next) => next();
    expressDefaultMock = jest.fn(() => mockApp);
    expressJsonMock = jest.fn(() => jsonMw);

    
    // 1) Mock express
    jest.doMock("express", () => {
        mockExpress = jest.fn(() => mockApp);
        mockExpress.json = expressJsonMock;
        return {
            __esModule: true,
            default: mockExpress,
        };
    });

    // 2) Mock middlewares
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

    // 3) Mock routers
    jest.doMock("../../src/health/healthRouter", () => ({
      __esModule: true,
      default: healthRouterMock,
    }));

    jest.doMock("../../src/account/accountRouter", () => ({
      __esModule: true,
      default: accountRouterMock,
    }));

    jest.doMock("../../src/auth/authRouter", () => ({
      __esModule: true,
      default: authRouterMock,
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

  test("throws if JWT_SECRET env variable is missing", () => {
    delete process.env.JWT_SECRET;
    const { createApp } = require("../../src/app");

    expect(() => createApp()).toThrow("Missing JWT_SECRET environment variable");
    expect(expressDefaultMock).not.toHaveBeenCalled();
  });

  test("creates app and wires all middleware/routes in correct order", () => {
    process.env.JWT_SECRET = "test-secret";

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
      ["/docs", swaggerServeMw, swaggerSetupMw],
      [notFoundHandlerMw],
      [errorHandlerMw],
    ]);
  });
});