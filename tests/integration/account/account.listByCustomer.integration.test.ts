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

describe("GET /accounts?customerId=...", () => {
  test("1+ account found for customerId => 200, array of found accounts is returned", async () => {
    mockVerify.mockReturnValue(mockedJwtPayloadStandard);
    mockFindMany.mockResolvedValue([
      buildMockAccountRecord(),
      buildMockAccountRecord({ id: mockAccountId2 })
    ]);

    const res = await request(app)
      .get("/accounts")
      .set("x-session-id", mockSessionId)
      .query({ customer_id: mockCustomerId });

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
    expect(mockFindMany).toHaveBeenCalledTimes(1);

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toEqual([
      buildAccountCreateOutput(),
      buildAccountCreateOutput({ id: mockAccountId2 }),
    ]);
  });

  test("No account found for customerId => 200, empty array is returned", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/accounts")
      .set("x-session-id", mockSessionId)
      .query({ customer_id: mockCustomerId });

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
      .send({ customer_id: mockCustomerId });

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });
});
