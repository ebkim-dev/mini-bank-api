import request from "supertest";

jest.mock("../../src/logging/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("swagger-ui-express", () => ({
  __esModule: true,
  default: {
    serve: (_req: any, _res: any, next: any) => next(),
    setup: (_spec: any) => (_req: any, res: any) => res.status(200).send("docs"),
  },
}));

jest.mock("../../src/config/swagger", () => ({
  swaggerSpec: { openapi: "3.0.0", info: { title: "Mock", version: "0" } },
}));

describe("app.ts (createApp)", () => {
  
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("createApp throws if JWT_SECRET is missing", async () => {
    
    const { createApp } = await import("../../src/app");
    const saved = process.env.JWT_SECRET;

    process.env.JWT_SECRET = "";
    expect(() => createApp()).toThrow("Missing JWT_SECRET environment variable");

    if (saved === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = saved;
  });

  test("creates app and unknown route returns 404 with traceId", async () => {
    const { createApp } = await import("../../src/app");
    const app = createApp();

    const res = await request(app).get("/some-unknown-route").expect(404);

    expect(res.body).toHaveProperty("code");
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("traceId");

    expect(res.headers).toHaveProperty("x-trace-id");
    expect(typeof res.headers["x-trace-id"]).toBe("string");
  });

  test("GET /docs is mounted and returns 200 (swagger mocked)", async () => {
    const { createApp } = await import("../../src/app");
    const app = createApp();

    const res = await request(app).get("/docs").expect(200);
    expect(res.text).toBe("docs");
  });

  test("router mount sanity: /auth/register exists (not 404)", async () => {
    const { createApp } = await import("../../src/app");
    const app = createApp();

    const res = await request(app).post("/auth/register").send({}).expect((r) => {
      if (r.status === 404) throw new Error("Expected /auth/register to be mounted, got 404");
    });

    expect(res.status).not.toBe(404);
  });

  test("router mount sanity: /health exists (not 404)", async () => {
    const { createApp } = await import("../../src/app");
    const app = createApp();

    const res = await request(app).get("/health").expect((r) => {
      if (r.status === 404) throw new Error("Expected /health to be mounted, got 404");
    });

    expect(res.status).not.toBe(404);
  });
});