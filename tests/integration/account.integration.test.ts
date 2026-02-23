
import request from "supertest";
import prisma from "../../src/db/prismaClient";
import { createApp } from "../../src/app";
import { Decimal } from "@prisma/client/runtime/client";
import { AccountStatus, AccountType } from "../../src/generated/enums";
import { AccountCreateInputOptionals, buildAccountCreateInput, buildAccountCreateOutput } from "./mockData/account.mock";

const app = createApp();

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Integration - Accounts API", () => {
  
  // 1) POST /accounts
  describe("POST /accounts", () => {
    test("Correct input => 201, new account is created and returned", async () => {
      const mockAccountInputOptionals: AccountCreateInputOptionals = {
        nickname: "alice",
        status: AccountStatus.ACTIVE,
        balance: (new Decimal(0)).toString(),
      }

      const mockAccountCreateInput = 
        buildAccountCreateInput(mockAccountInputOptionals);
      const mockAccountCreateOutput = buildAccountCreateOutput();

      const res = await request(app).post("/accounts").send(mockAccountCreateInput);

      expect(res.status).toBe(201);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject(mockAccountCreateOutput);
    });

    test("Optional fields missing => 201, new account is created and returned", async () => {
      const mockAccountCreateInput = buildAccountCreateInput();
      const mockAccountCreateOutput = buildAccountCreateOutput({ nickname: "" });

      const res = await request(app).post("/accounts").send(mockAccountCreateInput);

      expect(res.status).toBe(201);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject(mockAccountCreateOutput);
    });

    // test("A required field is missing => 400, centralized error response", async () => {
    //   const payload = {
    //     customer_id: testCustomerId.toString(),
    //     currency: "CAD",
    //   };

    //   const res = await request(app).post("/accounts").send(payload);

    //   expect(res.status).toBe(400);
    //   expect(res.headers).toHaveProperty("x-trace-id");

      
    //   expect(res.body).toHaveProperty("traceId");
    //   expect(res.body).toHaveProperty("code");
    //   expect(res.body).toHaveProperty("message");

    //   if (res.body.details) {
    //     expect(res.body.details).toHaveProperty("issues");
    //     expect(Array.isArray(res.body.details.issues)).toBe(true);
    //   }
    // });

    // test("Empty body is given => 400, centralized error response", async () => {
    //   const res = await request(app).post("/accounts").send({});

    //   expect(res.status).toBe(400);
    //   expect(res.headers).toHaveProperty("x-trace-id");

    //   expect(res.body).toHaveProperty("traceId");
    //   expect(res.body).toHaveProperty("code");
    //   expect(res.body).toHaveProperty("message");

    //   if (res.body.details) {
    //     expect(res.body.details).toHaveProperty("issues");
    //     expect(Array.isArray(res.body.details.issues)).toBe(true);
    //   }
    // });

    // test('Wrong field type (customer_id="abc") => 400 VALIDATION_ERROR', async () => {
    //   const payload = {
    //     customer_id: "abc",
    //     type: "CHECKING",
    //     currency: "CAD",
    //   };

    //   const res = await request(app).post("/accounts").send(payload);

    //   expect(res.status).toBe(400);
    //   expect(res.headers).toHaveProperty("x-trace-id");

    //   expect(res.body).toHaveProperty("traceId");
    //   expect(res.body).toHaveProperty("code", "VALIDATION_ERROR");
    //   expect(res.body).toHaveProperty("message");
    //   expect(res.body).toHaveProperty("details");

    //   expect(res.body.details).toHaveProperty("issues");
    //   expect(Array.isArray(res.body.details.issues)).toBe(true);
    // });

    // test("Large input string (longer than maxLength) => 400", async () => {
    //   const payload = {
    //     customer_id: testCustomerId.toString(),
    //     type: "CHECKING",
    //     currency: "CANADA",
    //     nickname: "x".repeat(200), 
    //   };

    //   const res = await request(app).post("/accounts").send(payload);

    //   expect(res.status).toBe(400);
    //   expect(res.headers).toHaveProperty("x-trace-id");

    //   expect(res.body).toHaveProperty("traceId");
    //   expect(res.body).toHaveProperty("code");
    //   expect(res.body).toHaveProperty("message");
    // });
  });
});