describe("server.ts (pure unit)", () => {
  const ORIGINAL_ENV = process.env;

  let listenMock: jest.Mock;
  let createAppMock: jest.Mock;

  let loggerInfoMock: jest.Mock;
  let loggerErrorMock: jest.Mock;

  const handlers: Partial<
    Record<
      "SIGINT" | "SIGTERM" | "unhandledRejection" | "uncaughtException",
      (...args: any[]) => void
    >
  > = {};

  let processOnSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };

    delete handlers.SIGINT;
    delete handlers.SIGTERM;
    delete handlers.unhandledRejection;
    delete handlers.uncaughtException;

    loggerInfoMock = jest.fn();
    loggerErrorMock = jest.fn();

    jest.doMock("../../src/logging/logger", () => {
      return {
        logger: {
          info: loggerInfoMock,
          error: loggerErrorMock,
        },
      };
    });

    jest.doMock("../../src/config/env", () => {
      return {
        __esModule: true,
        default: {
          port: 5555,
          env: "test",
        },
      };
    });

    
    listenMock = jest.fn((_port: any, cb?: any) => {
      if (typeof cb === "function") cb();
      return undefined;
    });

    createAppMock = jest.fn(() => ({
      listen: listenMock,
    }));

    jest.doMock("../../src/app", () => {
      return {
        __esModule: true,
        createApp: createAppMock,
      };
    });

    processOnSpy = jest.spyOn(process, "on").mockImplementation((event: any, cb: any) => {
      handlers[event as keyof typeof handlers] = cb;
      return process;
    });

    processExitSpy = jest.spyOn(process, "exit").mockImplementation(((_code?: number) => {
      return undefined as never;
    }) as any);
  });

  afterEach(() => {
    processOnSpy.mockRestore();
    processExitSpy.mockRestore();
    process.env = ORIGINAL_ENV;
  });

  test("starts the server, logs startup message, and registers process handlers", () => {
    require("../../src/server");

    expect(createAppMock).toHaveBeenCalledTimes(1);

    expect(listenMock).toHaveBeenCalledTimes(1);
    expect(listenMock.mock.calls[0][0]).toBe(5555);
    expect(typeof listenMock.mock.calls[0][1]).toBe("function");

    expect(loggerInfoMock).toHaveBeenCalledWith(
      "Mini Bank API is running on http://localhost:5555 in test mode"
    );

    expect(processOnSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith("unhandledRejection", expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith("uncaughtException", expect.any(Function));

    expect(handlers.SIGINT).toBeDefined();
    expect(handlers.SIGTERM).toBeDefined();
    expect(handlers.unhandledRejection).toBeDefined();
    expect(handlers.uncaughtException).toBeDefined();
  });

  test("SIGINT handler logs shutdown and exits with code 0", () => {
    require("../../src/server");

    expect(handlers.SIGINT).toBeDefined();
    handlers.SIGINT!();

    expect(loggerInfoMock).toHaveBeenCalledWith("Received SIGINT. Shutting down server...");
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  test("SIGTERM handler logs shutdown and exits with code 0", () => {
    require("../../src/server");

    expect(handlers.SIGTERM).toBeDefined();
    handlers.SIGTERM!();

    expect(loggerInfoMock).toHaveBeenCalledWith("Received SIGTERM. Shutting down server...");
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  test("unhandledRejection handler logs error with reason", () => {
    require("../../src/server");

    const reason = new Error("boom");

    expect(handlers.unhandledRejection).toBeDefined();
    handlers.unhandledRejection!(reason);

    expect(loggerErrorMock).toHaveBeenCalledWith("Unhandled promise rejection", { reason });
  });

  test("uncaughtException handler logs error details and exits with code 1", () => {
    require("../../src/server");

    const err = new Error("crash");

    expect(handlers.uncaughtException).toBeDefined();
    handlers.uncaughtException!(err);

    expect(loggerErrorMock).toHaveBeenCalledWith("Uncaught exception", {
      stack: err.stack,
      message: err.message,
    });

    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});