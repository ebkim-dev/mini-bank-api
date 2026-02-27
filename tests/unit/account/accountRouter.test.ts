import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";

import accountRouter from "../../../src/account/accountRouter";
import { errorHandler } from "../../../src/middleware/errorHandler";
import { UserRole } from "../../../src/generated/enums";

jest.mock("../../../src/account/accountController", () => ({
  createAccount: (_req: any, res: any) => res.status(201).json({ route: "createAccount" }),
  getAccountsByCustomerId: (_req: any, res: any) =>
    res.status(200).json({ route: "getAccountsByCustomerId" }),
  getAccount: (_req: any, res: any) => res.status(200).json({ route: "getAccount" }),
  updateAccount: (_req: any, res: any) => res.status(200).json({ route: "updateAccount" }),
  deleteAccount: (_req: any, res: any) => res.status(200).json({ route: "deleteAccount" }),
}));


function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/accounts", accountRouter);
  app.use(errorHandler);
  return app;
}

function makeToken(role: UserRole) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing. Ensure .env.test is loaded in jest.setup.ts");
  }

  return jwt.sign({ sub: "1", role }, secret, { expiresIn: "1h" });
}

describe("accountRouter.ts", () => {
  test("POST /accounts hits createAccount (requires ADMIN)", async () => {
    const app = makeApp();
    const token = makeToken(UserRole.ADMIN);

    const res = await request(app)
      .post("/accounts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer_id: "1",
        type: "CHECKING",
        currency: "USD",
      })
      .expect(201);

    expect(res.body.route).toBe("createAccount");
  });

  test("GET /accounts hits getAccountsByCustomerId", async () => {
    const app = makeApp();
    const token = makeToken(UserRole.STANDARD);

    const res = await request(app)
      .get("/accounts?customerId=1")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.route).toBe("getAccountsByCustomerId");
  });

  test("GET /accounts/:id hits getAccount", async () => {
    const app = makeApp();
    const token = makeToken(UserRole.STANDARD);

    const res = await request(app)
      .get("/accounts/123")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.route).toBe("getAccount");
  });

  test("PUT /accounts/:id hits updateAccount (requires ADMIN)", async () => {
    const app = makeApp();
    const token = makeToken(UserRole.ADMIN);

    const res = await request(app)
      .put("/accounts/55")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nickname: "New Nick",
      })
      .expect(200);

    expect(res.body.route).toBe("updateAccount");
  });

  test("POST /accounts/:id/close hits deleteAccount (requires ADMIN)", async () => {
    const app = makeApp();
    const token = makeToken(UserRole.ADMIN);

    const res = await request(app)
      .post("/accounts/9/close")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.route).toBe("deleteAccount");
  });

  test("sanity: DELETE /accounts/:id/close is not defined and should 404", async () => {
    const app = makeApp();
    const token = makeToken(UserRole.ADMIN);

    await request(app)
      .delete("/accounts/1/close")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });

  test("POST /accounts fails with 403 if role is not ADMIN", async () => {
    const app = makeApp();
    const token = makeToken(UserRole.STANDARD);

    const res = await request(app)
      .post("/accounts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer_id: "1",
        type: "CHECKING",
        currency: "USD",
      })
      .expect(403);

    expect(res.body.code).toBe("FORBIDDEN");
  });
});