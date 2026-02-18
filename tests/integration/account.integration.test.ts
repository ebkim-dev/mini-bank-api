// tests/integration/account.integration.test.ts

import request from "supertest";
import { execSync } from "child_process";

import { createApp } from "../../src/app";
import prisma from "../../src/db/prismaClient";

describe("Integration - Accounts API", () => {
  const app = createApp();

  let testCustomerId: bigint;

  
  beforeAll(async () => {
    
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
  });

  
  beforeEach(async () => {
    await prisma.account.deleteMany();
    await prisma.customer.deleteMany();

    const customer = await prisma.customer.create({
      data: {
        first_name: "Test",
        last_name: "Customer",
        email: `test_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`,
        phone: "1234567890",
      },
    });

    testCustomerId = customer.id;
  });

  afterAll(async () => {
    await prisma.account.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.$disconnect();
  });

  
  // 1) POST /accounts
  describe("POST /accounts", () => {
    test("Correct input => 201, new account is created and returned", async () => {
      const payload = {
        customer_id: testCustomerId.toString(),
        type: "CHECKING",
        currency: "CAD",
        nickname: "My Main Account",
      };

      const res = await request(app).post("/accounts").send(payload);

      expect(res.status).toBe(201);

      
      expect(res.headers).toHaveProperty("x-trace-id");

   
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("customer_id", testCustomerId.toString());
      expect(res.body).toHaveProperty("type", "CHECKING");
      expect(res.body).toHaveProperty("currency", "CAD");
    });

    test("Optional fields missing => 201, new account is created and returned", async () => {
      const payload = {
        customer_id: testCustomerId.toString(),
        type: "SAVINGS",
        currency: "CAD",
        
      };

      const res = await request(app).post("/accounts").send(payload);

      expect(res.status).toBe(201);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("customer_id", testCustomerId.toString());
      expect(res.body).toHaveProperty("type", "SAVINGS");
      expect(res.body).toHaveProperty("currency", "CAD");
    });

    test("A required field is missing => 400, centralized error response", async () => {
      const payload = {
        customer_id: testCustomerId.toString(),
        currency: "CAD",
      };

      const res = await request(app).post("/accounts").send(payload);

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      
      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("message");

      if (res.body.details) {
        expect(res.body.details).toHaveProperty("issues");
        expect(Array.isArray(res.body.details.issues)).toBe(true);
      }
    });

    test("Empty body is given => 400, centralized error response", async () => {
      const res = await request(app).post("/accounts").send({});

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("message");

      if (res.body.details) {
        expect(res.body.details).toHaveProperty("issues");
        expect(Array.isArray(res.body.details.issues)).toBe(true);
      }
    });

    test('Wrong field type (customer_id="abc") => 400 VALIDATION_ERROR', async () => {
      const payload = {
        customer_id: "abc",
        type: "CHECKING",
        currency: "CAD",
      };

      const res = await request(app).post("/accounts").send(payload);

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("details");

      expect(res.body.details).toHaveProperty("issues");
      expect(Array.isArray(res.body.details.issues)).toBe(true);
    });

    test("Large input string (longer than maxLength) => 400", async () => {
      const payload = {
        customer_id: testCustomerId.toString(),
        type: "CHECKING",
        currency: "CANADA",
        nickname: "x".repeat(200), 
      };

      const res = await request(app).post("/accounts").send(payload);

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("message");
    });
  });

  
  // 2) GET /accounts?customerId=...
  describe("GET /accounts?customerId=...", () => {
    test("1+ account found for customerId => 200, array of found accounts is returned", async () => {
      await prisma.account.create({
        data: {
          customer_id: testCustomerId,
          type: "CHECKING",
          currency: "CAD",
          nickname: "A1",
        },
      });

      await prisma.account.create({
        data: {
          customer_id: testCustomerId,
          type: "SAVINGS",
          currency: "CAD",
          nickname: "A2",
        },
      });

      const res = await request(app)
        .get("/accounts")
        .query({ customerId: testCustomerId.toString() });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      for (const acc of res.body) {
        expect(acc).toHaveProperty("customer_id", testCustomerId.toString());
        expect(acc).toHaveProperty("id");
        expect(acc).toHaveProperty("type");
        expect(acc).toHaveProperty("currency");
      }
    });

    test("No account found for customerId => 200, empty array is returned", async () => {
      const res = await request(app)
        .get("/accounts")
        .query({ customerId: testCustomerId.toString() });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    test("customerId is missing => 400", async () => {
      const res = await request(app).get("/accounts");

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("message");
    });

    test("customerId has invalid format => 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .get("/accounts")
        .query({ customerId: "abc" });

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("details");

      if (res.body.details) {
        expect(res.body.details).toHaveProperty("issues");
        expect(Array.isArray(res.body.details.issues)).toBe(true);
      }
    });
  });

 
  // 3) GET /accounts/:accountId
  describe("GET /accounts/:accountId", () => {
    test("Account found for accountId => 200, account is returned", async () => {
      
      const created = await prisma.account.create({
        data: {
          customer_id: testCustomerId,
          type: "CHECKING",
          currency: "CAD",
          nickname: "FetchMe",
        },
      });

      const res = await request(app).get(`/accounts/${created.id.toString()}`);
      
      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("id", created.id.toString());
      expect(res.body).toHaveProperty("customer_id", testCustomerId.toString());
      expect(res.body).toHaveProperty("type", "CHECKING");
      expect(res.body).toHaveProperty("currency", "CAD");
      expect(res.body).toHaveProperty("nickname", "FetchMe");
    });

    test("accountId has invalid format => 400 VALIDATION_ERROR", async () => {
      const res = await request(app).get("/accounts/abc");

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
      expect(res.body).toHaveProperty("message");

      // Optional validation issues
      if (res.body.details) {
        expect(res.body.details).toHaveProperty("issues");
        expect(Array.isArray(res.body.details.issues)).toBe(true);
      }
    });

    test("Account not found for accountId => 404", async () => {
      const nonExistentId = "999999999999";

      const res = await request(app).get(`/accounts/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code"); 
      expect(res.body).toHaveProperty("message");
    });
  });

 
  // 4) PUT /accounts/:accountId
  describe("PUT /accounts/:accountId", () => {
    test("nickname and status are both given => 200, account is updated and returned", async () => {
      const created = await prisma.account.create({
        data: {
          customer_id: testCustomerId,
          type: "CHECKING",
          currency: "CAD",
          nickname: "OldName",
          status: "ACTIVE",
        },
      });

      const payload = {
        nickname: "NewName",
        status: "CLOSED",
      };

      const res = await request(app)
        .put(`/accounts/${created.id.toString()}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("id", created.id.toString());
      expect(res.body).toHaveProperty("nickname", "NewName");
      expect(res.body).toHaveProperty("status", "CLOSED");
    });

    test("nickname only is given => 200, account is updated and returned", async () => {
      const created = await prisma.account.create({
        data: {
          customer_id: testCustomerId,
          type: "SAVINGS",
          currency: "CAD",
          nickname: "Before",
          status: "ACTIVE",
        },
      });

      const payload = { nickname: "After" };

      const res = await request(app)
        .put(`/accounts/${created.id.toString()}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("id", created.id.toString());
      expect(res.body).toHaveProperty("nickname", "After");
      // status should remain unchanged
      expect(res.body).toHaveProperty("status", "ACTIVE");
    });

    test("status only is given => 200, account is updated and returned", async () => {
      const created = await prisma.account.create({
        data: {
          customer_id: testCustomerId,
          type: "CHECKING",
          currency: "CAD",
          nickname: "SameNick",
          status: "ACTIVE",
        },
      });

      const payload = { status: "CLOSED" };

      const res = await request(app)
        .put(`/accounts/${created.id.toString()}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("id", created.id.toString());
      expect(res.body).toHaveProperty("nickname", "SameNick");
      expect(res.body).toHaveProperty("status", "CLOSED");
    });

    test("Empty body is given => 400 (no fields to update)", async () => {
      const created = await prisma.account.create({
        data: {
          customer_id: testCustomerId,
          type: "CHECKING",
          currency: "CAD",
          nickname: "NoUpdate",
          status: "ACTIVE",
        },
      });

      const res = await request(app)
        .put(`/accounts/${created.id.toString()}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("message");
    });

    test("accountId has invalid format => 400 VALIDATION_ERROR", async () => {
      const res = await request(app).put("/accounts/abc").send({ nickname: "X" });

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
      expect(res.body).toHaveProperty("message");
    });

    test("Large input string is given (longer than maxLength) => 400", async () => {
      const created = await prisma.account.create({
        data: {
          customer_id: testCustomerId,
          type: "CHECKING",
          currency: "CAD",
          nickname: "Short",
          status: "ACTIVE",
        },
      });

      const payload = { nickname: "x".repeat(200) };

      const res = await request(app)
        .put(`/accounts/${created.id.toString()}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("message");
    });

    test("Unknown field is given => 400 (strict allowlist validation)", async () => {
      const created = await prisma.account.create({
        data: {
          customer_id: testCustomerId,
          type: "CHECKING",
          currency: "CAD",
          nickname: "Strict",
          status: "ACTIVE",
        },
      });

      const payload = { balance: "99999" };

      const res = await request(app)
        .put(`/accounts/${created.id.toString()}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
      expect(res.body).toHaveProperty("message");

      if (res.body.details) {
        expect(res.body.details).toHaveProperty("issues");
        expect(Array.isArray(res.body.details.issues)).toBe(true);
      }
    });

    test("Account not found for accountId => 404", async () => {
      const nonExistentId = "999999999999";

      const res = await request(app)
        .put(`/accounts/${nonExistentId}`)
        .send({ nickname: "DoesNotMatter" });

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code"); 
      expect(res.body).toHaveProperty("message");
    });
  });

    
  // 5) POST /accounts/:accountId/close
  describe("POST /accounts/:accountId/close", () => {
    test("Account found for accountId => 200, account is closed and returned", async () => {
      const created = await prisma.account.create({
        data: {
          customer_id: testCustomerId,
          type: "CHECKING",
          currency: "CAD",
          nickname: "ToClose",
          status: "ACTIVE",
        },
      });

      const res = await request(app).post(
        `/accounts/${created.id.toString()}/close`
      );

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("id", created.id.toString());
      expect(res.body).toHaveProperty("customer_id", testCustomerId.toString());
      expect(res.body).toHaveProperty("status", "CLOSED");
    });

    test("accountId has invalid format => 400 VALIDATION_ERROR", async () => {
      const res = await request(app).post("/accounts/abc/close");

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
      expect(res.body).toHaveProperty("message");

      if (res.body.details) {
        expect(res.body.details).toHaveProperty("issues");
        expect(Array.isArray(res.body.details.issues)).toBe(true);
      }
    });

    test("Account not found for accountId => 404", async () => {
      const nonExistentId = "999999999999";

      const res = await request(app).post(
        `/accounts/${nonExistentId}/close`
      );

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("traceId");
      expect(res.body).toHaveProperty("code"); 
      expect(res.body).toHaveProperty("message");
    });
  });
});
