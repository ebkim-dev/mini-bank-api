import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";

import authRouter from "../../../src/auth/authRouter";
import { errorHandler } from "../../../src/middleware/errorHandler";
import { UserRole } from "../../../src/generated/enums";

jest.mock("../../../src/auth/authController", () => ({
  register: (_req: any, res: any) => res.status(201).json({ route: "register" }),
  login: (_req: any, res: any) => res.status(200).json({ route: "login" }),

  me: (_req: any, res: any) => res.status(200).json({ route: "me" }),
  profile: (_req: any, res: any) => res.status(200).json({ route: "profile" }),
  whoami: (_req: any, res: any) => res.status(200).json({ route: "whoami" }),
  validateToken: (_req: any, res: any) =>
    res.status(200).json({ route: "validateToken" }),
}));

type RouteInfo = {
  path: string;
  methods: string[];
};

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRouter);
  app.use(errorHandler);
  return app;
}

function makeToken(role: UserRole) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing. Ensure .env.test is loaded.");
  }
  return jwt.sign({ sub: "1", role }, secret, { expiresIn: "1h" });
}

function listRoutes(router: any): RouteInfo[] {
  return (router.stack || [])
    .filter((layer: any) => layer.route && layer.route.path)
    .map((layer: any) => ({
      path: layer.route.path as string,
      methods: Object.keys(layer.route.methods || {}).filter(
        (m: string) => layer.route.methods[m]
      ),
    }));
}

describe("authRouter.ts", () => {

  test("router defines /register and /login routes", () => {
    const routes: RouteInfo[] = listRoutes(authRouter);
    const paths: string[] = routes.map((r: RouteInfo) => r.path);

    expect(paths).toContain("/register");
    expect(paths).toContain("/login");
  });

  test("POST /auth/register hits register", async () => {
    const app = makeApp();

    const res = await request(app)
      .post("/auth/register")
      .send({ username: "user123", password: "password123" })
      .expect(201);

    expect(res.body.route).toBe("register");
  });

  test("POST /auth/login hits login", async () => {
    const app = makeApp();

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "user123", password: "password123" })
      .expect(200);

    expect(res.body.route).toBe("login");
  });

  test("POST /auth/register rejects extra fields (strict schema) -> 400", async () => {
    const app = makeApp();

    const res = await request(app)
      .post("/auth/register")
      .send({ username: "user123", password: "password123", extra: true })
      .expect(400);

    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  test("POST /auth/login rejects missing password -> 400", async () => {
    const app = makeApp();

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "user123" })
      .expect(400);

    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  test("covers remaining GET routes in authRouter", async () => {
    const app = makeApp();
    const token = makeToken(UserRole.STANDARD);

    const routes: RouteInfo[] = listRoutes(authRouter);

    const getRoutes: RouteInfo[] = routes.filter(
      (r: RouteInfo) =>
        r.methods.includes("get") &&
        r.path !== "/register" &&
        r.path !== "/login"
    );

    for (const r of getRoutes) {
      const resNoAuth = await request(app).get(`/auth${r.path}`);
      const resWithAuth = await request(app)
        .get(`/auth${r.path}`)
        .set("Authorization", `Bearer ${token}`);

      expect(resNoAuth.status).not.toBe(404);
      expect(resWithAuth.status).not.toBe(404);
    }
  });
});