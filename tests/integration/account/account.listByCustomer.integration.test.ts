import request from "supertest";
import { createApp } from "../../../src/app";
import { UserRole } from "../../../src/generated/enums";
import { 
  buildAccountCreateOutput,
  buildMockAccountRecord,
  mockCustomerId,
  mockAccountId2,
  buildJwtPayload,
  mockMissingCustomerId,
  mockSessionId,
  mockRedisKey,
} from "./account.mock";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn().mockResolvedValue("mock_jwt_token") }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: { account: { findMany: jest.fn() } }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("jsonwebtoken");
import jwt from "jsonwebtoken";


const app = createApp();

const mockedJwtPayloadAdmin = buildJwtPayload();
const mockedJwtPayloadStandard = buildJwtPayload({ role: UserRole.STANDARD });

const mockFindMany = prismaClient.account.findMany as jest.Mock;
const mockVerify = jwt.verify as jest.Mock;
beforeEach(async () => {
  jest.clearAllMocks();
  mockVerify.mockReturnValue(mockedJwtPayloadAdmin);
});

describe("GET /accounts?customerId=...", () => {
  async function getAccounts(
    query: { customer_id?: string }, 
    sessionId: string = mockSessionId
  ) {
    return request(app)
      .get("/accounts")
      .set("x-session-id", sessionId)
      .query(query);
  }

  test("1+ account found for customerId => 200, array of found accounts is returned", async () => {
    mockVerify.mockReturnValue(mockedJwtPayloadStandard);
    mockFindMany.mockResolvedValue([
      buildMockAccountRecord(),
      buildMockAccountRecord({ id: mockAccountId2 })
    ]);

    const res = await getAccounts({ customer_id: mockCustomerId });

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toEqual([
      buildAccountCreateOutput(),
      buildAccountCreateOutput({ id: mockAccountId2 }),
    ]);

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  test("No account found for customerId => 200, empty array is returned", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await getAccounts({ customer_id: mockMissingCustomerId });

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toEqual([]);

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  test("customerId is missing => 400", async () => {
    const res = await getAccounts({});

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  test("customerId has invalid format => 400", async () => {
    const res = await getAccounts({ customer_id: "abc" });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  it('should return 401 given invalid header', async () => {
    const res = await getAccounts(
      { customer_id: mockCustomerId }, 
      "asdnflsvbsabsl"
    );

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });
});
