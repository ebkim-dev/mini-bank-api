const onMock = jest.fn();
jest.mock("redis", () => ({
  createClient: jest.fn(() => ({ 
    on: onMock,
    isOpen: false,
    connect: jest.fn(),
    quit: jest.fn()
  })),
}));

import { logger } from "../../../src/logging/logger";
import { redisClient, connectRedis, disconnectRedis } from "../../../src/redis/redisClient";

beforeEach(() => {
  redisClient.connect = jest.fn();
  redisClient.quit = jest.fn();
});

describe("redisClient onError registration", () => {
  it("should register error handler on creation", () => {
    expect(redisClient.on).toHaveBeenCalledWith("error", expect.any(Function));
  });

  it("should have an error callback invoking logger.error", () => {  
    const fakeError = new Error("fake redis failure");
    const errorCallback = onMock.mock.calls[0][1];
    const loggerSpy = jest.spyOn(logger, "error").mockImplementation();

    errorCallback!(fakeError);

    expect(loggerSpy).toHaveBeenCalledWith("Redis error:", fakeError);
    loggerSpy.mockRestore();
  });
});

describe("connectRedis", () => {
  it("calls connect if client is not open", async () => {
    Object.defineProperty(redisClient, "isOpen", { value: false });
    await connectRedis();
    expect(redisClient.connect).toHaveBeenCalled();
  });

  test("does not call connect if client is open", async () => {
    Object.defineProperty(redisClient, "isOpen", { value: true });
    await connectRedis();
    expect(redisClient.connect).not.toHaveBeenCalled();
  });
});

describe("disconnectRedis", () => {
  test("calls quit if client is open", async () => {
    Object.defineProperty(redisClient, "isOpen", { value: true });
    await disconnectRedis();
    expect(redisClient.quit).toHaveBeenCalled();
  });

  test("does not call quit if client is closed", async () => {
    Object.defineProperty(redisClient, "isOpen", { value: false });
    await disconnectRedis();
    expect(redisClient.quit).not.toHaveBeenCalled();
  });
});



