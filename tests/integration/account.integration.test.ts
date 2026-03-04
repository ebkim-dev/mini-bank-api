import request from "supertest";
import { createApp } from "../../src/app";
import { Decimal } from "@prisma/client/runtime/client";
import { UserRole, AccountStatus } from "../../src/generated/enums";
import { 
  buildAccountCreateInput, 
  buildAccountCreateOutput,
  buildMockAccountRecord,
  buildToken
} from "./mockData/account.mock";

jest.mock("../../src/db/prismaClient", () => ({
  __esModule: true,
  default: {
    account: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    }
  },
}));
import prismaClient from "../../src/db/prismaClient";
import { Prisma } from "../../src/generated/client";

const app = createApp();
const CUSTOMER_ID = "550e8400-e29b-41d4-a716-446655440000";
const mockAccountId: string = "550e8400-e29b-41d4-a716-446655440001";
const MISSING_ACCOUNT_ID: string = "550e8400-e29b-41d4-a716-44665544ffff";
let token: string;

beforeAll(async () => {
  token = buildToken(UserRole.ADMIN, "1h");
})

const mockCreate = prismaClient.account.create as jest.Mock;
const mockUpdate = prismaClient.account.update as jest.Mock;
const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockFindMany = prismaClient.account.findMany as jest.Mock;

beforeEach(async () => {
  jest.clearAllMocks();
  mockCreate.mockResolvedValue(buildMockAccountRecord());
  mockUpdate.mockResolvedValue(buildMockAccountRecord());
  mockFindUnique.mockResolvedValue(buildMockAccountRecord());
  mockFindMany.mockResolvedValue([]);
});

describe("Integration - Accounts API", () => {
  describe("POST /accounts", () => {
    test("Correct input => 201, new account is created and returned", async () => {
      const mockAccountCreateInput = buildAccountCreateInput({
        nickname: "alice",
        status: AccountStatus.ACTIVE,
        balance: (new Decimal(0)).toString()
      });
      const mockAccountCreateOutput = buildAccountCreateOutput({
        nickname: "alice"
      });
      mockCreate.mockResolvedValue(buildMockAccountRecord({
        nickname: "alice"
      }));

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
      const mockAccountCreateOutput = buildAccountCreateOutput();

      console.log(mockAccountCreateInput);

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
      const standardToken = buildToken(UserRole.STANDARD, "1h");

      const res = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${standardToken}`)
        .send(buildAccountCreateInput(mockAccountCreateInput));

      expect(res.status).toBe(403);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });

  describe("GET /accounts?customerId=...", () => {
    test("1+ account found for customerId => 200, array of found accounts is returned", async () => {
      mockFindMany.mockResolvedValue([
        buildMockAccountRecord(),
        buildMockAccountRecord({ id: "550e8400-e29b-41d4-a716-446655440002" })
      ]);

      const standardToken = buildToken(UserRole.STANDARD, "1h");
      const res = await request(app)
        .get("/accounts")
        .set("Authorization", `Bearer ${standardToken}`)
        .query({ customer_id: CUSTOMER_ID });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body).toEqual([
        buildAccountCreateOutput(),
        buildAccountCreateOutput(),
      ]);
    });

    test("No account found for customerId => 200, empty array is returned", async () => {
      const res = await request(app)
        .get("/accounts")
        .set("Authorization", `Bearer ${token}`)
        .query({ customer_id: CUSTOMER_ID });

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
        .query({ customer_id: "abc" });

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 401 given invalid header', async () => {
      const res = await request(app)
        .get("/accounts")
        .set("Authorization", `NOTBEARER ${token}`)
        .send({ customer_id: CUSTOMER_ID });

      expect(res.status).toBe(401);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });

  describe("GET /accounts/:accountId", () => {
    test("Account found for accountId => 200, account is returned", async () => {
      const standardToken = buildToken(UserRole.STANDARD, "1h");
      const res = await request(app)
        .get(`/accounts/${mockAccountId}`)
        .set("Authorization", `Bearer ${standardToken}`);

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toHaveProperty("customer_id", CUSTOMER_ID);
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
      mockFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(`/accounts/${MISSING_ACCOUNT_ID}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 401 given missing token', async () => {
      const res = await request(app)
        .get(`/accounts/${mockAccountId}`)
        .set("Authorization", `Bearer`);

      expect(res.status).toBe(401);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });

  describe("PUT /accounts/:accountId", () => {
    test("nickname and status are both given => 200, account is updated and returned", async () => {
      mockUpdate.mockResolvedValue(buildMockAccountRecord({
        nickname: "newNick", 
        status: AccountStatus.CLOSED
      }));

      const res = await request(app)
        .put(`/accounts/${mockAccountId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ 
          nickname: "newNick", 
          status: AccountStatus.CLOSED
        });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toMatchObject({
        customer_id: CUSTOMER_ID,
        nickname: "newNick",
        status: AccountStatus.CLOSED,
      });
    });

    test("nickname only is given => 200, account is updated and returned", async () => {
      mockUpdate.mockResolvedValue(buildMockAccountRecord({
        nickname: "onlyNick",
      }));

      const res = await request(app)
        .put(`/accounts/${mockAccountId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ nickname: "onlyNick" });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toMatchObject({
        customer_id: CUSTOMER_ID,
        nickname: "onlyNick",
      });
    });

    test("status only is given => 200, account is updated and returned", async () => {
      mockUpdate.mockResolvedValue(buildMockAccountRecord({
        status: AccountStatus.CLOSED
      }));

      const res = await request(app)
        .put(`/accounts/${mockAccountId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: AccountStatus.CLOSED });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(res.body).toMatchObject({
        customer_id: CUSTOMER_ID,
        status: AccountStatus.CLOSED,
      });
    });

    test("Empty body is given => 400, atleast one field required", async () => {
      const res = await request(app)
        .put(`/accounts/${mockAccountId}`)
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
      const longNickname = "a".repeat(500);

      const res = await request(app)
        .put(`/accounts/${mockAccountId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ nickname: longNickname });

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Account not found for accountId => 404", async () => {
      const mockError = { code: "P2025" } as any;
      Object.setPrototypeOf(
        mockError,
        Prisma.PrismaClientKnownRequestError.prototype
      );
      mockUpdate.mockRejectedValue(mockError);

      const res = await request(app)
        .put(`/accounts/${MISSING_ACCOUNT_ID}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ nickname: "x" });

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 401 given invalid token', async () => {
      const res = await request(app)
        .put(`/accounts/${mockAccountId}`)
        .set("Authorization", "Bearer wrongToken")
        .send({ nickname: "newName" });

      expect(res.status).toBe(401);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 403 given STANDARD role', async() => {
      const standardToken = buildToken(UserRole.STANDARD, "1h");

      const res = await request(app)
        .put(`/accounts/${mockAccountId}`)
        .set("Authorization", `Bearer ${standardToken}`)
        .send({ nickname: "newName" });

      expect(res.status).toBe(403);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });

  describe("POST /accounts/:accountId/close", () => {
    test("Account found for accountId => 200, account is closed and returned", async () => {
      mockUpdate.mockResolvedValue(buildMockAccountRecord({
        status: AccountStatus.CLOSED
      }));

      const res = await request(app)
        .post(`/accounts/${mockAccountId}/close`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject({
        customer_id: CUSTOMER_ID,
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
      const mockError = { code: "P2025" } as any;
      Object.setPrototypeOf(
        mockError,
        Prisma.PrismaClientKnownRequestError.prototype
      );
      mockUpdate.mockRejectedValue(mockError);

      const res = await request(app)
        .post(`/accounts/${MISSING_ACCOUNT_ID}/close`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("Close already closed account => 200", async () => {
      mockUpdate.mockResolvedValueOnce(buildMockAccountRecord({
        status: AccountStatus.CLOSED
      })).mockResolvedValueOnce(buildMockAccountRecord({
        status: AccountStatus.CLOSED
      }));

      const first = await request(app)
        .post(`/accounts/${mockAccountId}/close`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
        expect(first.status).toBe(200);
      
      const second = await request(app)
        .post(`/accounts/${mockAccountId}/close`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
        expect(second.status).toBe(200);
      
      expect(second.headers).toHaveProperty("x-trace-id");
    });

    it('should return 401 given expired token', async () => {
      const expiredToken = buildToken(UserRole.ADMIN, -1);
      
      const res = await request(app)
        .post(`/accounts/${mockAccountId}/close`)
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 403 given STANDARD role', async() => {
      const standardToken = buildToken(UserRole.STANDARD, "1h");

      const res = await request(app)
        .post(`/accounts/${mockAccountId}/close`)
        .set("Authorization", `Bearer ${standardToken}`);

      expect(res.status).toBe(403);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });
});