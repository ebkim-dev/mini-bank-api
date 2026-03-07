
jest.mock("../../src/redis/redisClient", () => ({
  redisClient: {
    quit: jest.fn(),
  },
}));
import { redisClient } from "../../src/redis/redisClient";
jest.mock("../../src/logging/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));
import { logger } from "../../src/logging/logger";

import { setupProcessHandlers } from "../../src/lifecycle";
import type { Server } from "http";

describe("setupProcessHandlers", () => {
  let server: Partial<Server>;
  let handlers: Record<string, Function>;

  beforeEach(() => {
    handlers = {};

    jest.spyOn(process, "on").mockImplementation((event: any, handler: any) => {
      handlers[event] = handler;
      return process;
    });
    
    jest.spyOn(process, "exit").mockImplementation(jest.fn() as any);

    server = {
      close: jest.fn((callback?: (err?: Error) => void) => {
        callback?.();
        return server as Server;
      }),
    };

    (redisClient.quit as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("registers all process handlers", () => {
    setupProcessHandlers(server as Server);

    expect(process.on).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    expect(process.on).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
    expect(process.on).toHaveBeenCalledWith("uncaughtException", expect.any(Function));
    expect(process.on).toHaveBeenCalledWith("unhandledRejection", expect.any(Function));
  });

  it("gracefully shuts down on SIGINT", async () => {
    setupProcessHandlers(server as Server);

    expect(handlers["SIGINT"]).toBeDefined();
    await handlers["SIGINT"]!();

    expect(logger.info).toHaveBeenCalledWith(
      "Received SIGINT. Shutting down server..."
    );

    expect(server.close).toHaveBeenCalled();
    expect(redisClient.quit).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it("gracefully shuts down on SIGTERM", async () => {
    setupProcessHandlers(server as Server);

    expect(handlers["SIGTERM"]).toBeDefined();
    await handlers["SIGTERM"]!();

    expect(logger.info).toHaveBeenCalledWith(
      "Received SIGTERM. Shutting down server..."
    );

    expect(server.close).toHaveBeenCalled();
    expect(redisClient.quit).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it("gracefully shuts down on uncaughtException", async () => {
    setupProcessHandlers(server as Server);
    const err = new Error("shutdown error");

    expect(handlers["uncaughtException"]).toBeDefined();
    await handlers["uncaughtException"]!(err);

    expect(logger.error).toHaveBeenCalledWith(
      "Uncaught exception",
      expect.objectContaining({ message: "shutdown error" }),
    );

    expect(server.close).toHaveBeenCalled();
    expect(redisClient.quit).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("gracefully shuts down on unhandledRejection", async () => {
    setupProcessHandlers(server as Server);
    const err = new Error("shutdown error");

    expect(handlers["unhandledRejection"]).toBeDefined();
    await handlers["unhandledRejection"]!(err);

    expect(logger.error).toHaveBeenCalledWith(
      "Uncaught exception",
      expect.objectContaining({ message: "shutdown error" }),
    );

    expect(server.close).toHaveBeenCalled();
    expect(redisClient.quit).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});