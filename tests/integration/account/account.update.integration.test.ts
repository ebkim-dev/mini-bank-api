import request from "supertest";
import { createApp } from "../../../src/app";
import { Decimal } from "@prisma/client/runtime/client";
import { Prisma } from "../../../src/generated/client";
import { JwtPayload } from "../../../src/auth/user";
import { UserRole, AccountStatus } from "../../../src/generated/enums";
import { 
  buildAccountCreateInput, 
  buildAccountCreateOutput,
  buildMockAccountRecord,
  buildToken,
  mockCustomerId,
  mockAccountId1,
  mockAccountId2,
  mockMissingAccountId,
  buildJwtPayload,
} from "./account.mock";

jest.mock("../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn().mockResolvedValue("mock_jwt_token") }
}));
import { redisClient } from "../../../src/redis/redisClient";

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
import prismaClient from "../../../src/db/prismaClient";

jest.mock("jsonwebtoken");
import jwt from "jsonwebtoken";


const app = createApp();
let token: string;

const mockedJwtPayloadAdmin = buildJwtPayload();
const mockedJwtPayloadStandard = buildJwtPayload({ role: UserRole.STANDARD });

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

describe("PUT /accounts/:accountId", () => {
  test("nickname and status are both given => 200, account is updated and returned", async () => {
    mockUpdate.mockResolvedValue(buildMockAccountRecord({
      nickname: "newNick", 
      status: AccountStatus.CLOSED
    }));

    const res = await request(app)
      .put(`/accounts/${mockAccountId1}`)
      .set("x-session-id", mockSessionId)
      .send({ 
        nickname: "newNick", 
        status: AccountStatus.CLOSED
      });

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject({
      customer_id: mockCustomerId,
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
      .put(`/accounts/${mockAccountId1}`)
      .set("x-session-id", mockSessionId)
      .send({ nickname: "onlyNick" });

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject({
      customer_id: mockCustomerId,
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
      .put(`/accounts/${mockAccountId1}`)
      .set("x-session-id", mockSessionId)
      .send({ status: AccountStatus.CLOSED });

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject({
      customer_id: mockCustomerId,
      status: AccountStatus.CLOSED,
    });
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("Empty body is given => 400, atleast one field required", async () => {
    const res = await request(app)
      .put(`/accounts/${mockAccountId1}`)
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
      .put(`/accounts/${mockAccountId1}`)
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
      .put(`/accounts/${mockMissingAccountId}`)
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
      .put(`/accounts/${mockAccountId1}`)
      .set("Authorization", "Bearer wrongToken")
      .send({ nickname: "newName" });

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  it('should return 403 given STANDARD role', async() => {
    mockVerify.mockReturnValue(mockedJwtPayloadStandard);

    const res = await request(app)
      .put(`/accounts/${mockAccountId1}`)
      .set("x-session-id", mockSessionId)
      .send({ nickname: "newName" });

    expect(res.status).toBe(403);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });
});
