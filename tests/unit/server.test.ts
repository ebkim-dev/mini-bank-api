
jest.doMock("../../src/config/env", () => ({
  __esModule: true,
  default: { port: 5555, env: "test" },
}));
import * as redisClient from "../../src/redis/redisClient";
import * as appModule from "../../src/app";
import * as lifecycle from "../../src/lifecycle";
import { bootstrap } from "../../src/server";


describe("bootstrap", () => {
  let listenMock: jest.Mock;

  beforeEach(() => {
    listenMock = jest.fn().mockReturnValue("fake-server");
    jest.spyOn(redisClient, "connectRedis").mockResolvedValue(undefined);
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