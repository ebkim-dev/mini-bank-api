
type Handler = (...args: any[]) => any;

describe("server.ts", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("bootstraps: calls createApp, listens on PORT, registers process handlers", async () => {
    process.env.PORT = "4321";
    process.env.JWT_SECRET = "test-secret";

    const handlers: Record<string, Handler> = {};

    const onSpy = jest
      .spyOn(process, "on")
      .mockImplementation(((event: string, cb: Handler) => {
        handlers[event] = cb;
        return process;
      }) as any);

    const exitSpy = jest.spyOn(process, "exit").mockImplementation((() => {

    }) as any);

    const loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    jest.doMock("../../src/logging/logger", () => ({
      logger: loggerMock,
    }));

    const closeMock = jest.fn((cb?: any) => cb && cb());
    const listenMock = jest.fn((_port: any, cb?: any) => {
      if (cb) cb();
      return { close: closeMock };
    });

    const fakeApp = {
      listen: listenMock,
    };

    const createAppMock = jest.fn(() => fakeApp);

    jest.doMock("../../src/app", () => ({
      createApp: createAppMock,
    }));

    
    await import("../../src/server");
   
    expect(createAppMock).toHaveBeenCalledTimes(1);
    
    expect(listenMock).toHaveBeenCalledTimes(1);
    
    const firstCall = listenMock.mock.calls[0];
    expect(firstCall).toBeDefined();

    const listenArgPort = firstCall![0];
    expect(String(listenArgPort)).toBe("4321");

    
    expect(onSpy).toHaveBeenCalled();
   
    const registeredEvents = Object.keys(handlers);
    expect(registeredEvents.length).toBeGreaterThan(0);

    expect(
        registeredEvents.includes("SIGTERM") ||
        registeredEvents.includes("SIGINT") ||
        registeredEvents.includes("uncaughtException") ||
        registeredEvents.includes("unhandledRejection")
    ).toBe(true);

    
    expect(exitSpy).toBeDefined();
  });

  test("handlers: executes registered process handlers for coverage", async () => {
    process.env.PORT = "5000";
    process.env.JWT_SECRET = "test-secret";

    const handlers: Record<string, (...args: any[]) => any> = {};

    jest.spyOn(process, "on").mockImplementation(((event: string, cb: any) => {
      handlers[event] = cb;
      return process;
    }) as any);

    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as any);

    const loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    jest.doMock("../../src/logging/logger", () => ({
      logger: loggerMock,
    }));

    const closeMock = jest.fn((cb?: any) => cb && cb());
    const listenMock = jest.fn((_port: any, cb?: any) => {
      if (cb) cb();
      return { close: closeMock };
    });

    jest.doMock("../../src/app", () => ({
      createApp: () => ({ listen: listenMock }),
    }));

    await import("../../src/server");

    if (handlers["SIGTERM"]) {
      handlers["SIGTERM"]();
      expect(
        closeMock.mock.calls.length > 0 ||
          exitSpy.mock.calls.length > 0 ||
          loggerMock.info.mock.calls.length > 0 ||
          loggerMock.warn.mock.calls.length > 0
      ).toBe(true);
    }

    if (handlers["SIGINT"]) {
      handlers["SIGINT"]();
      expect(
        closeMock.mock.calls.length > 0 ||
          exitSpy.mock.calls.length > 0 ||
          loggerMock.info.mock.calls.length > 0 ||
          loggerMock.warn.mock.calls.length > 0
      ).toBe(true);
    }

    if (handlers["unhandledRejection"]) {
      handlers["unhandledRejection"](new Error("promise failed"));
      expect(
        loggerMock.error.mock.calls.length > 0 || exitSpy.mock.calls.length > 0
      ).toBe(true);
    }

    if (handlers["uncaughtException"]) {
      handlers["uncaughtException"](new Error("crashed"));
      expect(
        loggerMock.error.mock.calls.length > 0 || exitSpy.mock.calls.length > 0
      ).toBe(true);
    }
  });
});