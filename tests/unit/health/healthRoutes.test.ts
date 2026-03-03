import type { Request, Response } from "express";

describe("healthRouter", () => {
  let getMock: jest.Mock;
  let registeredHandler: (req: Request, res: Response) => void;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    getMock = jest.fn();
    jest.doMock("express", () => {
      return {
        Router: () => ({
          get: getMock
        })
      };
    });

    require("../../../src/health/healthRouter");
    expect(getMock).toHaveBeenCalledWith("/", expect.any(Function));
    registeredHandler = getMock.mock.calls[0][1];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('registers GET "/" route exactly once', () => {
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock.mock.calls[0][0]).toBe("/");
    expect(typeof getMock.mock.calls[0][1]).toBe("function");
  });

  test('GET "/" returns 200 and expected payload when fail is not "true"', () => {
    jest.useFakeTimers();
    const fixedNow = new Date("2026-03-02T14:00:00.000Z");
    jest.setSystemTime(fixedNow);

    const uptimeSpy = jest.spyOn(process, "uptime").mockReturnValue(123.45);
    const req = {
      query: {}
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;

    registeredHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledTimes(1);

    expect(res.json).toHaveBeenCalledWith({
      status: "ok",
      service: "mini-bank-api",
      uptime: 123.45,
      timestamp: "2026-03-02T14:00:00.000Z"
    });

    uptimeSpy.mockRestore();
  });

  test('GET "/" throws BadRequest AppError when query.fail === "true"', () => {
    const { AppError } = require("../../../src/error/error");

    const req = {
      query: { fail: "true" }
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;

    try {
      registeredHandler(req, res);
      fail("Expected handler to throw, but it did not throw");
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe("HEALTH_CHECK_FAILED");
      expect(err.message).toBe("Health check forced to fail");
    }

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});