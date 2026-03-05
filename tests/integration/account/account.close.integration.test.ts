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

const mockedJwtPayloadAdmin: JwtPayload = buildJwtPayload({ 
  role: UserRole.ADMIN
});

const mockedJwtPayloadStandard: JwtPayload = buildJwtPayload();

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

describe("POST /accounts/:accountId/close", () => {
  test("Account found for accountId => 200, account is closed and returned", async () => {
    mockUpdate.mockResolvedValue(buildMockAccountRecord({
      status: AccountStatus.CLOSED
    }));

    const res = await request(app)
      .post(`/accounts/${mockAccountId1}/close`)
      .set("x-session-id", mockSessionId)
      .send({});

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
      .post(`/accounts/${mockMissingAccountId}/close`)
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
      .post(`/accounts/${mockAccountId1}/close`)
      .set("x-session-id", mockSessionId)
      .send({});
    
    const second = await request(app)
      .post(`/accounts/${mockAccountId1}/close`)
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
      .post(`/accounts/${mockAccountId1}/close`)
      .set("x-session-id", mockSessionId);

    expect(res.status).toBe(403);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });
});