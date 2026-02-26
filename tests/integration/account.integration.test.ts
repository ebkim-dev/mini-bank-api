import request from "supertest";
import prisma from "../../src/db/prismaClient";
import { createApp } from "../../src/app";
import { Decimal } from "@prisma/client/runtime/client";
import { 
  AccountCreateInputOptionals, 
  buildAccountCreateInput, 
  buildAccountCreateOutput
} from "./mockData/account.mock";
import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole, AccountStatus } from "../../src/generated/enums";

const app = createApp();

function buildToken(
  role: UserRole, 
  expiresIn: NonNullable<SignOptions["expiresIn"]>
) {
  return jwt.sign(
    {
      sub: "123",
      role: role,
    },
    process.env.JWT_SECRET as string,
    { expiresIn }
  );
}

async function createAccountAndGetId(
  inputOverrides: Partial<ReturnType<typeof buildAccountCreateInput>> = {}
): Promise<string> {
  const input = buildAccountCreateInput(inputOverrides);

  const res = await request(app)
    .post("/accounts")
    .set("Authorization", `Bearer ${token}`)
    .send(input);

  expect(res.status).toBe(201);

  const account = await prisma.account.findFirst({
    where: { customer_id: BigInt(1) },
    orderBy: { id: "desc" },
  });
  if (!account) throw new Error("Account was not created in DB");

  return account.id.toString();
}

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  token = buildToken(UserRole.ADMIN, "1h");
})

afterEach(async () => {
  await prisma.user.deleteMany();
  await prisma.account.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});


let token: string;
describe("Integration - Accounts API", () => {
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

      const res = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send(mockAccountCreateInput);

      expect(res.status).toBe(201);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject(mockAccountCreateOutput);
    });

    test("Optional fields missing => 201, new account is created and returned", async () => {
      const mockAccountCreateInput = buildAccountCreateInput();
      const mockAccountCreateOutput = buildAccountCreateOutput({ nickname: "" });

      const res = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send(mockAccountCreateInput);

      expect(res.status).toBe(201);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject(mockAccountCreateOutput);
    });

    test("A required field is missing => 400", async () => {
     
      const badInput: any = buildAccountCreateInput();
      delete badInput.currency;

      const res = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send(badInput);

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Empty body is given => 400", async () => {
      const res = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test('Wrong field type is given (e.g. passing "abc" to customer_id) => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send(buildAccountCreateInput({ customer_id: "abc" }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Large input string is given (longer than maxLength) => 400", async () => {
      const longNickname = "a".repeat(500);

      const res = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send(buildAccountCreateInput({ nickname: longNickname }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test('Invalid enum value - type = "SAVINGSS" => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send(buildAccountCreateInput({ type: "SAVINGSS" as any }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test('Invalid enum value - status = "OPEN" => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send(buildAccountCreateInput({ status: "OPEN" as any }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test('Invalid currency format - currency="US" => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send(buildAccountCreateInput({ currency: "US" }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test('Invalid currency format - currency="USDD" => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send(buildAccountCreateInput({ currency: "USDD" }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 401 given missing header', async () => {
      const mockAccountCreateInput = buildAccountCreateInput();

      const res = await request(app)
        .post("/accounts")
        .set("Authorization", "")
        .send(buildAccountCreateInput(mockAccountCreateInput));

      expect(res.status).toBe(401);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 403 given STANDARD role', async() => {
      const mockAccountCreateInput = buildAccountCreateInput();
      token = buildToken(UserRole.STANDARD, "1h");

      const res = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send(buildAccountCreateInput(mockAccountCreateInput));

      expect(res.status).toBe(403);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });

  describe("GET /accounts?customerId=...", () => {
    test("1+ account found for customerId => 200, array of found accounts is returned", async () => {
      await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send(buildAccountCreateInput({ nickname: "a1" }));
      await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send(buildAccountCreateInput({ nickname: "a2" }));

      token = buildToken(UserRole.STANDARD, "1h");
      const res = await request(app)
        .get("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .query({ customerId: "1" });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      expect(res.body[0]).toHaveProperty("customer_id", "1");
      expect(res.body[0]).toHaveProperty("type");
      expect(res.body[0]).toHaveProperty("currency");
    });

    test("No account found for customerId => 200, empty array is returned", async () => {
      const res = await request(app)
        .get("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .query({ customerId: "1" });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toEqual([]);
    });

    test("customerId is missing => 400", async () => {
      const res = await request(app)
        .get("/accounts")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("customerId has invalid format => 400", async () => {
      const res = await request(app)
        .get("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .query({ customerId: "abc" });

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 401 given invalid header', async () => {
      const res = await request(app)
        .get("/accounts")
        .set("Authorization", `NOTBEARER ${token}`)
        .send({ customerId: "1" });

      expect(res.status).toBe(401);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });

  describe("GET /accounts/:accountId", () => {
    test("Account found for accountId => 200, account is returned", async () => {
      const accountId = await createAccountAndGetId({ nickname: "alice" });

      token = buildToken(UserRole.STANDARD, "1h");
      const res = await request(app)
        .get(`/accounts/${accountId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("customer_id", "1");
      expect(res.body).toHaveProperty("type");
      expect(res.body).toHaveProperty("currency");
    });

    test("accountId has invalid format => 400", async () => {
      const res = await request(app)
        .get(`/accounts/abc`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Account not found for accountId => 404", async () => {
      const res = await request(app)
        .get(`/accounts/999999999`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 401 given missing token', async () => {
      const accountId = await createAccountAndGetId({ nickname: "alice" });
      const res = await request(app)
        .get(`/accounts/${accountId}`)
        .set("Authorization", `Bearer`);

      expect(res.status).toBe(401);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });

  describe("PUT /accounts/:accountId", () => {
    test("nickname and status are both given => 200, account is updated and returned", async () => {
      const accountId = await createAccountAndGetId({ nickname: "old" });

      const res = await request(app)
        .put(`/accounts/${accountId}`)
        .set("Authorization", `Bearer ${token}`)
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
        .set("Authorization", `Bearer ${token}`)
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
        .set("Authorization", `Bearer ${token}`)
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

      const res = await request(app)
        .put(`/accounts/${accountId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
      
    });

    test("accountId has invalid format => 400", async () => {
      const res = await request(app)
        .put(`/accounts/abc`)
        .set("Authorization", `Bearer ${token}`)
        .send({ nickname: "x" });

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Large input string is given (longer than maxLength) => 400", async () => {
      const accountId = await createAccountAndGetId({ nickname: "ok" });
      const longNickname = "a".repeat(500);

      const res = await request(app)
        .put(`/accounts/${accountId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ nickname: longNickname });

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Account not found for accountId => 404", async () => {
      const res = await request(app)
        .put(`/accounts/999999999`)
        .set("Authorization", `Bearer ${token}`)
        .send({ nickname: "x" });

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 401 given invalid token', async () => {
      const accountId = await createAccountAndGetId({ nickname: "oldName" });
      const res = await request(app)
        .put(`/accounts/${accountId}`)
        .set("Authorization", "Bearer wrongToken")
        .send({ nickname: "newName" });

      expect(res.status).toBe(401);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 403 given STANDARD role', async() => {
      const accountId = await createAccountAndGetId({ nickname: "oldName" });
      token = buildToken(UserRole.STANDARD, "1h");

      const res = await request(app)
        .put(`/accounts/${accountId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ nickname: "newName" });

      expect(res.status).toBe(403);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });

  describe("POST /accounts/:accountId/close", () => {
    test("Account found for accountId => 200, account is closed and returned", async () => {
      const accountId = await createAccountAndGetId({ status: AccountStatus.ACTIVE });

      const res = await request(app)
        .post(`/accounts/${accountId}/close`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject({
        customer_id: "1",
        status: AccountStatus.CLOSED,
      });
    });

    test("accountId has invalid format => 400", async () => {
      const res = await request(app)
        .post(`/accounts/abc/close`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Account not found for accountId => 404", async () => {
      const res = await request(app)
        .post(`/accounts/999999999/close`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Close already closed account => 200", async () => {
      const accountId = await createAccountAndGetId({ status: AccountStatus.ACTIVE });

      const first = await request(app)
        .post(`/accounts/${accountId}/close`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
        expect(first.status).toBe(200);

      
      const second = await request(app)
        .post(`/accounts/${accountId}/close`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
        expect(second.status).toBe(200);
      
      expect(second.headers).toHaveProperty("x-trace-id");
    });

    it('should return 401 given expired token', async () => {
      const accountId = await createAccountAndGetId({ status: AccountStatus.ACTIVE });
      token = buildToken(UserRole.ADMIN, -1);
      
      const res = await request(app)
        .post(`/accounts/${accountId}/close`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 403 given STANDARD role', async() => {
      const accountId = await createAccountAndGetId({ status: AccountStatus.ACTIVE });
      token = buildToken(UserRole.STANDARD, "1h");

      const res = await request(app)
        .post(`/accounts/${accountId}/close`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });
});