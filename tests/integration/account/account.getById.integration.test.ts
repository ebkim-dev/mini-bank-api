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

describe("GET /accounts/:accountId", () => {
  test("Account found for accountId => 200, account is returned", async () => {
    mockVerify.mockReturnValue(mockedJwtPayloadStandard);
    mockFindUnique.mockResolvedValue(buildMockAccountRecord());
    const mockAccountCreateOutput = buildAccountCreateOutput();

    const res = await request(app)
      .get(`/accounts/${mockAccountId1}`)
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
      .get(`/accounts/${mockMissingAccountId}`)
      .set("x-session-id", mockSessionId);

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  it('should return 401 given missing token', async () => {
    const res = await request(app)
      .get(`/accounts/${mockAccountId1}`);

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });
});
