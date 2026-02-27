import request from "supertest";
import express from "express";
import healthRouter from "../../../src/health/healthRouter";
import { errorHandler } from "../../../src/middleware/errorHandler";

jest.mock("../../../src/logging/logger", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));


function makeApp() {
  const app = express();

  app.use("/health", healthRouter);

  app.use(errorHandler);

  return app;
}


describe("healthRouter.ts", () => {

  test("GET /health returns 200 with ok payload", async () => {
    const app = makeApp();

    const res = await request(app).get("/health").expect(200);

    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("service", "mini-bank-api");

    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);

    expect(typeof res.body.timestamp).toBe("string");
    expect(() => new Date(res.body.timestamp).toISOString()).not.toThrow();
  });

  test('GET /health?fail=true returns 400 with HEALTH_CHECK_FAILED error', async () => {
    const app = makeApp();

    const res = await request(app).get("/health?fail=true").expect(400);

    expect(res.body).toHaveProperty("code", "HEALTH_CHECK_FAILED");
    expect(res.body).toHaveProperty("message", "Health check forced to fail");
  });

  test("GET /health?fail=false still returns 200 (only exact string 'true' fails)", async () => {
    const app = makeApp();

    await request(app).get("/health?fail=false").expect(200);
  });
});