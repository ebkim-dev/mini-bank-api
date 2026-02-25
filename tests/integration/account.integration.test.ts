
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
  await prisma.account.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});


async function createAccountAndGetId(inputOverrides: Partial<ReturnType<typeof buildAccountCreateInput>> = {}
): Promise<string> {
  const input = buildAccountCreateInput(inputOverrides);

  const res = await request(app)
    .post("/accounts")
    .send(input);

  expect(res.status).toBe(201);

  const account = await prisma.account.findFirst({
    where: { customer_id: BigInt(1) },
    orderBy: { id: "desc" },
  });
  if (!account) throw new Error("Account was not created in DB");

  return account.id.toString();
}


describe("Integration - Accounts API", () => {
  
  // 1) POST /accounts
  describe("POST /accounts", () => {
    test("Optional fields missing => 201, new account is created and returned", async () => {
      const mockAccountCreateInput = buildAccountCreateInput();
      const mockAccountCreateOutput = buildAccountCreateOutput({ nickname: "" });

      const res = await request(app).post("/accounts").send(mockAccountCreateInput);

      expect(res.status).toBe(201);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject(mockAccountCreateOutput);
    });

    test("A required field is missing => 400", async () => {
      // Remove required field: currency
      const badInput: any = buildAccountCreateInput();
      delete badInput.currency;

      const res = await request(app).post("/accounts").send(badInput);

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Empty body is given => 400", async () => {
      const res = await request(app).post("/accounts").send({});

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test('Wrong field type is given (e.g. passing "abc" to customer_id) => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .send(buildAccountCreateInput({ customer_id: "abc" }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Large input string is given (longer than maxLength) => 400", async () => {
      const longNickname = "a".repeat(500);

      const res = await request(app)
        .post("/accounts")
        .send(buildAccountCreateInput({ nickname: longNickname }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test('Invalid enum value - type = "SAVINGSS" => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .send(buildAccountCreateInput({ type: "SAVINGSS" as any }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test('Invalid enum value - status = "OPEN" => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .send(buildAccountCreateInput({ status: "OPEN" as any }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test('Invalid currency format - currency="US" => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .send(buildAccountCreateInput({ currency: "US" }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test('Invalid currency format - currency="USDD" => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .send(buildAccountCreateInput({ currency: "USDD" }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });

  describe("GET /accounts?customerId=...", () => {
    test("1+ account found for customerId => 200, array of found accounts is returned", async () => {
      // Create 2 accounts for customer_id=1
      await request(app).post("/accounts").send(buildAccountCreateInput({ nickname: "a1" }));
      await request(app).post("/accounts").send(buildAccountCreateInput({ nickname: "a2" }));

      const res = await request(app).get("/accounts").query({ customerId: "1" });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      // Loose matching: at least one should look like an account output
      expect(res.body[0]).toHaveProperty("customer_id", "1");
      expect(res.body[0]).toHaveProperty("type");
      expect(res.body[0]).toHaveProperty("currency");
    });

    test("No account found for customerId => 200, empty array is returned", async () => {
      const res = await request(app).get("/accounts").query({ customerId: "1" });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toEqual([]);
    });

    test("customerId is missing => 400", async () => {
      const res = await request(app).get("/accounts");

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("customerId has invalid format => 400", async () => {
      const res = await request(app).get("/accounts").query({ customerId: "abc" });

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });

  // 3) GET /accounts/:accountId
  describe("GET /accounts/:accountId", () => {
    test("Account found for accountId => 200, account is returned", async () => {
      const accountId = await createAccountAndGetId({ nickname: "alice" });

      const res = await request(app).get(`/accounts/${accountId}`);

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      // Should look like the serialized account
      expect(res.body).toHaveProperty("customer_id", "1");
      expect(res.body).toHaveProperty("type");
      expect(res.body).toHaveProperty("currency");
    });

    test("accountId has invalid format => 400", async () => {
      const res = await request(app).get(`/accounts/abc`);

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Account not found for accountId => 404", async () => {
      const res = await request(app).get(`/accounts/999999999`);

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });

  // 4) PUT /accounts/:accountId
  describe("PUT /accounts/:accountId", () => {
    test("nickname and status are both given => 200, account is updated and returned", async () => {
      const accountId = await createAccountAndGetId({ nickname: "old" });

      const res = await request(app)
        .put(`/accounts/${accountId}`)
        .send({ nickname: "newNick", status: AccountStatus.CLOSED });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toMatchObject({
        customer_id: "1",
        nickname: "newNick",
        status: AccountStatus.CLOSED,
      });
    });

    test("nickname only is given => 200, account is updated and returned", async () => {
      const accountId = await createAccountAndGetId({ nickname: "old" });

      const res = await request(app)
        .put(`/accounts/${accountId}`)
        .send({ nickname: "onlyNick" });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toMatchObject({
        customer_id: "1",
        nickname: "onlyNick",
      });
    });

    test("status only is given => 200, account is updated and returned", async () => {
      const accountId = await createAccountAndGetId({ status: AccountStatus.ACTIVE });

      const res = await request(app)
        .put(`/accounts/${accountId}`)
        .send({ status: AccountStatus.CLOSED });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toMatchObject({
        customer_id: "1",
        status: AccountStatus.CLOSED,
      });
    });

    test("Empty body is given => 400, atleast one field required", async () => {
      const accountId = await createAccountAndGetId({ nickname: "same" });

      const res = await request(app).put(`/accounts/${accountId}`).send({});

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
      
    });

    test("accountId has invalid format => 400", async () => {
      const res = await request(app).put(`/accounts/abc`).send({ nickname: "x" });

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Large input string is given (longer than maxLength) => 400", async () => {
      const accountId = await createAccountAndGetId({ nickname: "ok" });
      const longNickname = "a".repeat(500);

      const res = await request(app)
        .put(`/accounts/${accountId}`)
        .send({ nickname: longNickname });

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Account not found for accountId => 404", async () => {
      const res = await request(app)
        .put(`/accounts/999999999`)
        .send({ nickname: "x" });

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });

  // 5) POST /accounts/:accountId/close
  describe("POST /accounts/:accountId/close", () => {
    test("Account found for accountId => 200, account is closed and returned", async () => {
      const accountId = await createAccountAndGetId({ status: AccountStatus.ACTIVE });

      const res = await request(app).post(`/accounts/${accountId}/close`).send({});

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject({
        customer_id: "1",
        status: AccountStatus.CLOSED,
      });
    });

    test("accountId has invalid format => 400", async () => {
      const res = await request(app).post(`/accounts/abc/close`).send({});

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Account not found for accountId => 404", async () => {
      const res = await request(app).post(`/accounts/999999999/close`).send({});

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Close already closed account => either 409 or 200 idempotent", async () => {
      const accountId = await createAccountAndGetId({ status: AccountStatus.ACTIVE });

      // First close
      const first = await request(app).post(`/accounts/${accountId}/close`).send({});
      expect([200, 409]).toContain(first.status);

      // Second close (idempotent or conflict depending on implementation)
      const second = await request(app).post(`/accounts/${accountId}/close`).send({});

      expect([200, 409]).toContain(second.status);
      expect(second.headers).toHaveProperty("x-trace-id");
    });
  });
});