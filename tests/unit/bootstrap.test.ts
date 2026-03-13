jest.mock("../../src/logging/logger", () => ({
  logger: { 
    info: jest.fn(),
    error: jest.fn(),
  }
}));
import { logger } from "../../src/logging/logger";
jest.doMock("../../src/config/env", () => ({
  __esModule: true,
  default: { port: 5555, env: "test" },
}));
jest.mock("../../src/redis/redisClient", () => ({
  connectRedis: jest.fn(),
}));
import * as redisClient from "../../src/redis/redisClient";
jest.mock("../../src/lifecycle", () => ({
  setupProcessHandlers: jest.fn(),
}));

import * as appModule from "../../src/app";
import * as lifecycle from "../../src/lifecycle";
import { bootstrap } from "../../src/bootstrap";


describe("bootstrap", () => {
  let listenMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(redisClient, "connectRedis").mockResolvedValue(undefined);
    listenMock = jest.fn().mockImplementation((port, callback) => {
      if (callback) { callback(); }
      return "fake-server";
    });
    jest.spyOn(appModule, "createApp").mockReturnValue({
      listen: listenMock,
    } as any);
    jest.spyOn(lifecycle, "setupProcessHandlers").mockImplementation(() => {});
  });

  it("makes required calls correctly", async () => {
    await bootstrap();

    expect(redisClient.connectRedis).toHaveBeenCalled();
    expect(appModule.createApp).toHaveBeenCalled();
    expect(listenMock).toHaveBeenCalled();
    expect(lifecycle.setupProcessHandlers).toHaveBeenCalled();
  });
});