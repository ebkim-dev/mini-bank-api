import request from "supertest";
import { createApp } from "../../../src/app";
import { Prisma } from "../../../src/generated/client";
import { UserRole, AccountStatus } from "../../../src/generated/enums";
import { 
  buildMockAccountRecord,
  mockCustomerId,
  mockAccountId1,
  mockMissingAccountId,
  buildJwtPayload,
  mockSessionId,
  mockRedisKey,
} from "./account.mock";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn().mockResolvedValue("mock_jwt_token") }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: { account: { update: jest.fn() } }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("jsonwebtoken");
import jwt from "jsonwebtoken";


const app = createApp();

const mockedJwtPayloadAdmin = buildJwtPayload();
const mockedJwtPayloadStandard = buildJwtPayload({ role: UserRole.STANDARD });

const mockUpdate = prismaClient.account.update as jest.Mock;
const mockVerify = jwt.verify as jest.Mock;
beforeEach(async () => {
  jest.clearAllMocks();
  mockUpdate.mockResolvedValue(buildMockAccountRecord());
  mockVerify.mockReturnValue(mockedJwtPayloadAdmin);
});

describe("POST /accounts/:accountId/close", () => {
  async function closeAccount(
    accountId: string = mockAccountId1,
    sessionId: string = mockSessionId
  ) {
    return request(app)
      .post(`/accounts/${accountId}/close`)
      .set("x-session-id", sessionId);
  }

  test("Account found for accountId => 200, account is closed and returned", async () => {
    const closedStatus = { status: AccountStatus.CLOSED };
    mockUpdate.mockResolvedValue(buildMockAccountRecord(closedStatus));

    const res = await closeAccount();

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(closedStatus);
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("accountId has invalid format => 400", async () => {
    const res = await closeAccount("abc");

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

    const res = await closeAccount(mockMissingAccountId);

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("Close already closed account => 200", async () => {
    mockUpdate
      .mockResolvedValueOnce(buildMockAccountRecord({
        status: AccountStatus.CLOSED
      }))
      .mockResolvedValueOnce(buildMockAccountRecord({
        status: AccountStatus.CLOSED
      }));

    const res1 = await closeAccount(mockAccountId1);
    const res2 = await closeAccount(mockAccountId1);
    
    expect(res1.status).toBe(200);
    expect(res1.headers).toHaveProperty("x-trace-id");
    expect(res2.status).toBe(200);
    expect(res2.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it('should return 403 given STANDARD role', async() => {
    mockVerify.mockReturnValue(mockedJwtPayloadStandard);

    const res = await closeAccount(mockAccountId1);

    expect(res.status).toBe(403);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });
});