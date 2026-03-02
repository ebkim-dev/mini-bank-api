import request from "supertest";
import { createApp } from "../../src/app";
import { Decimal } from "@prisma/client/runtime/client";
import { Prisma } from "../../src/generated/client";
import { JwtPayload } from "../../src/auth/user";
import { UserRole, AccountStatus } from "../../src/generated/enums";
import { 
  buildAccountCreateInput, 
  buildAccountCreateOutput,
  buildMockAccountRecord,
  buildToken
} from "./mockData/account.mock";

jest.mock("../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn().mockResolvedValue("mock_jwt_token") }
}));
import { redisClient } from "../../src/redis/redisClient";

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

jest.mock("jsonwebtoken");
import jwt from "jsonwebtoken";


const app = createApp();
const CUSTOMER_ID = "550e8400-e29b-41d4-a716-446655440000";
const mockAccountId: string = "550e8400-e29b-41d4-a716-446655440001";
const MISSING_ACCOUNT_ID: string = "550e8400-e29b-41d4-a716-44665544ffff";
let token: string;

const mockedJwtPayloadAdmin: JwtPayload = {
  sub: mockAccountId,
  role: UserRole.ADMIN
};

const mockedJwtPayloadStandard: JwtPayload = {
  sub: mockAccountId,
  role: UserRole.STANDARD
};

beforeAll(async () => {
  token = buildToken(UserRole.ADMIN, "5m");
})

const mockSessionId: string = "mockSessionId";
const mockRedisKey: string = `session:${mockSessionId}`;

const mockCreate = prismaClient.account.create as jest.Mock;
const mockUpdate = prismaClient.account.update as jest.Mock;
const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockFindMany = prismaClient.account.findMany as jest.Mock;
const mockVerify = jwt.verify as jest.Mock;
beforeEach(async () => {
  jest.clearAllMocks();
  mockCreate.mockResolvedValue(buildMockAccountRecord());
  mockUpdate.mockResolvedValue(buildMockAccountRecord());
  mockFindUnique.mockResolvedValue(buildMockAccountRecord());
  mockFindMany.mockResolvedValue([]);
  mockVerify.mockReturnValue(mockedJwtPayloadAdmin);
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
        .set("x-session-id", mockSessionId)
        .send(mockAccountCreateInput);

      expect(res.status).toBe(201);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject(mockAccountCreateOutput);

      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    test("Optional fields missing => 201, new account is created and returned", async () => {
      const mockAccountCreateInput = buildAccountCreateInput();
      const mockAccountCreateOutput = buildAccountCreateOutput();
      mockCreate.mockResolvedValue(buildMockAccountRecord());

      const res = await request(app)
        .post("/accounts")
        .set("x-session-id", mockSessionId)
        .send(mockAccountCreateInput);

      expect(res.status).toBe(201);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject(mockAccountCreateOutput);

      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    test("A required field is missing => 400", async () => {
      const { currency, ...badInput } = buildAccountCreateInput();

      const res = await request(app)
        .post("/accounts")
        .set("x-session-id", mockSessionId)
        .send(badInput);

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });

    test("Empty body is given => 400", async () => {
      const res = await request(app)
        .post("/accounts")
        .set("x-session-id", mockSessionId)
        .send({});

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });

    test('Wrong field type is given (e.g. passing "abc" to customer_id) => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .set("x-session-id", mockSessionId)
        .send(buildAccountCreateInput({ customer_id: "abc" }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });

    test("Large input string is given (longer than maxLength) => 400", async () => {
      const longNickname = "a".repeat(500);

      const res = await request(app)
        .post("/accounts")
        .set("x-session-id", mockSessionId)
        .send(buildAccountCreateInput({ nickname: longNickname }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });

    test('Invalid enum value - type = "SAVINGSS" => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .set("x-session-id", mockSessionId)
        .send(buildAccountCreateInput({ type: "SAVINGSS" as any }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });

    test('Invalid enum value - status = "OPEN" => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .set("x-session-id", mockSessionId)
        .send(buildAccountCreateInput({ status: "OPEN" as any }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });

    test('Invalid currency format - currency="US" => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .set("x-session-id", mockSessionId)
        .send(buildAccountCreateInput({ currency: "US" }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });

    test('Invalid currency format - currency="USDD" => 400', async () => {
      const res = await request(app)
        .post("/accounts")
        .set("x-session-id", mockSessionId)
        .send(buildAccountCreateInput({ currency: "USDD" }));

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });

    it('should return 401 given missing header', async () => {
      const mockAccountCreateInput = buildAccountCreateInput();

      const res = await request(app)
        .post("/accounts")
        .set("x-session-id", "")
        .send(buildAccountCreateInput(mockAccountCreateInput));

      expect(res.status).toBe(401);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 403 given STANDARD role', async() => {
      const mockAccountCreateInput = buildAccountCreateInput();
      mockVerify.mockReturnValue(mockedJwtPayloadStandard);

      const res = await request(app)
        .post("/accounts")
        .set("x-session-id", mockSessionId)
        .send(buildAccountCreateInput(mockAccountCreateInput));

      expect(res.status).toBe(403);
      expect(res.headers).toHaveProperty("x-trace-id");

      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });
  });

  describe("GET /accounts?customerId=...", () => {
    test("1+ account found for customerId => 200, array of found accounts is returned", async () => {
      mockVerify.mockReturnValue(mockedJwtPayloadStandard);
      mockFindMany.mockResolvedValue([
        buildMockAccountRecord(),
        buildMockAccountRecord({ id: "550e8400-e29b-41d4-a716-446655440002" })
      ]);

      const res = await request(app)
        .get("/accounts")
        .set("x-session-id", mockSessionId)
        .query({ customer_id: CUSTOMER_ID });

      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
      expect(mockFindMany).toHaveBeenCalledTimes(1);

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toEqual([
        buildAccountCreateOutput(),
        buildAccountCreateOutput(),
      ]);
    });

    test("No account found for customerId => 200, empty array is returned", async () => {
      mockFindMany.mockResolvedValue([]);

      const res = await request(app)
        .get("/accounts")
        .set("x-session-id", mockSessionId)
        .query({ customer_id: CUSTOMER_ID });

      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
      expect(mockFindMany).toHaveBeenCalledTimes(1);

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toEqual([]);
    });

    test("customerId is missing => 400", async () => {
      const res = await request(app)
        .get("/accounts")
        .set("x-session-id", mockSessionId);
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    test("customerId has invalid format => 400", async () => {
      const res = await request(app)
        .get("/accounts")
        .set("x-session-id", mockSessionId)
        .query({ customer_id: "abc" });

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
    });

    it('should return 401 given invalid header', async () => {
      const res = await request(app)
        .get("/accounts")
        .set("Authorization", `Bearer tokenasdnflsvbsabsl`)
        .send({ customer_id: CUSTOMER_ID });

      expect(res.status).toBe(401);
      expect(res.headers).toHaveProperty("x-trace-id");
    });
  });

  describe("GET /accounts/:accountId", () => {
    test("Account found for accountId => 200, account is returned", async () => {
      mockVerify.mockReturnValue(mockedJwtPayloadStandard);
      mockFindUnique.mockResolvedValue(buildMockAccountRecord());
      const mockAccountCreateOutput = buildAccountCreateOutput();

      const res = await request(app)
        .get(`/accounts/${mockAccountId}`)
        .set("x-session-id", mockSessionId);

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject(mockAccountCreateOutput);
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
      expect(mockFindUnique).toHaveBeenCalledTimes(1);
    });

    test("accountId has invalid format => 400", async () => {
      const res = await request(app)
        .get(`/accounts/abc`)
        .set("x-session-id", mockSessionId);

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });

    test("Account not found for accountId => 404", async () => {
      mockFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(`/accounts/${MISSING_ACCOUNT_ID}`)
        .set("x-session-id", mockSessionId);

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });

    it('should return 401 given missing token', async () => {
      const res = await request(app)
        .get(`/accounts/${mockAccountId}`);

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
        .set("x-session-id", mockSessionId)
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
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    test("nickname only is given => 200, account is updated and returned", async () => {
      mockUpdate.mockResolvedValue(buildMockAccountRecord({
        nickname: "onlyNick",
      }));

      const res = await request(app)
        .put(`/accounts/${mockAccountId}`)
        .set("x-session-id", mockSessionId)
        .send({ nickname: "onlyNick" });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject({
        customer_id: CUSTOMER_ID,
        nickname: "onlyNick",
      });
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    test("status only is given => 200, account is updated and returned", async () => {
      mockUpdate.mockResolvedValue(buildMockAccountRecord({
        status: AccountStatus.CLOSED
      }));

      const res = await request(app)
        .put(`/accounts/${mockAccountId}`)
        .set("x-session-id", mockSessionId)
        .send({ status: AccountStatus.CLOSED });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject({
        customer_id: CUSTOMER_ID,
        status: AccountStatus.CLOSED,
      });
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    test("Empty body is given => 400, atleast one field required", async () => {
      const res = await request(app)
        .put(`/accounts/${mockAccountId}`)
        .set("x-session-id", mockSessionId)
        .send({});

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });

    test("accountId has invalid format => 400", async () => {
      const res = await request(app)
        .put(`/accounts/abc`)
        .set("x-session-id", mockSessionId)
        .send({ nickname: "x" });

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });

    test("Large input string is given (longer than maxLength) => 400", async () => {
      const longNickname = "a".repeat(500);

      const res = await request(app)
        .put(`/accounts/${mockAccountId}`)
        .set("x-session-id", mockSessionId)
        .send({ nickname: longNickname });

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
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
        .set("x-session-id", mockSessionId)
        .send({ nickname: "x" });

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledTimes(1);
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
      mockVerify.mockReturnValue(mockedJwtPayloadStandard);

      const res = await request(app)
        .put(`/accounts/${mockAccountId}`)
        .set("x-session-id", mockSessionId)
        .send({ nickname: "newName" });

      expect(res.status).toBe(403);
      expect(res.headers).toHaveProperty("x-trace-id");
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });
  });

  describe("POST /accounts/:accountId/close", () => {
    test("Account found for accountId => 200, account is closed and returned", async () => {
      mockUpdate.mockResolvedValue(buildMockAccountRecord({
        status: AccountStatus.CLOSED
      }));

      const res = await request(app)
        .post(`/accounts/${mockAccountId}/close`)
        .set("x-session-id", mockSessionId)
        .send({});

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty("x-trace-id");
      expect(res.body).toMatchObject({
        customer_id: CUSTOMER_ID,
        status: AccountStatus.CLOSED,
      });
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    test("accountId has invalid format => 400", async () => {
      const res = await request(app)
        .post(`/accounts/abc/close`)
        .set("x-session-id", mockSessionId)
        .send({});

      expect(res.status).toBe(400);
      expect(res.headers).toHaveProperty("x-trace-id");
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
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
        .set("x-session-id", mockSessionId)
        .send({});

      expect(res.status).toBe(404);
      expect(res.headers).toHaveProperty("x-trace-id");
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    test("Close already closed account => 200", async () => {
      mockUpdate.mockResolvedValueOnce(buildMockAccountRecord({
        status: AccountStatus.CLOSED
      })).mockResolvedValueOnce(buildMockAccountRecord({
        status: AccountStatus.CLOSED
      }));

      const first = await request(app)
        .post(`/accounts/${mockAccountId}/close`)
        .set("x-session-id", mockSessionId)
        .send({});
      
      const second = await request(app)
        .post(`/accounts/${mockAccountId}/close`)
        .set("x-session-id", mockSessionId)
        .send({});
      
      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(first.headers).toHaveProperty("x-trace-id");
      expect(second.headers).toHaveProperty("x-trace-id");
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    it('should return 403 given STANDARD role', async() => {
      mockVerify.mockReturnValue(mockedJwtPayloadStandard);

      const res = await request(app)
        .post(`/accounts/${mockAccountId}/close`)
        .set("x-session-id", mockSessionId);

      expect(res.status).toBe(403);
      expect(res.headers).toHaveProperty("x-trace-id");
        
      expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
      expect(mockVerify).toHaveBeenCalled();
    });
  });
});