import request from "supertest";
import { createApp } from "../../../src/app";
import { UserRole } from "../../../src/generated/enums";
import { 
  buildAccountCreateOutput,
  buildMockAccountRecord,
  buildJwtPayload,
} from "./account.mock.integration";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn().mockResolvedValue("mock_jwt_token") }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: { account: { findUnique: jest.fn() } }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("jsonwebtoken");
import jwt from "jsonwebtoken";
import { mockAccountId1, mockMissingAccountId, mockRedisKey, mockSessionId } from "../../common.mock";


const app = createApp();

const mockedJwtPayloadAdmin = buildJwtPayload();
const mockedJwtPayloadStandard = buildJwtPayload({ role: UserRole.STANDARD });

const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockVerify = jwt.verify as jest.Mock;
beforeEach(async () => {
  jest.clearAllMocks();
  mockVerify.mockReturnValue(mockedJwtPayloadAdmin);
});

describe("GET /accounts/:accountId", () => {
  async function getAccountRequest(accountId: string) {
    return request(app)
      .get(`/accounts/${accountId}`)
      .set("x-session-id", mockSessionId);
  }

  test("Account found for accountId => 200, account is returned", async () => {
    mockVerify.mockReturnValue(mockedJwtPayloadStandard);
    mockFindUnique.mockResolvedValue(buildMockAccountRecord());

    const res = await getAccountRequest(mockAccountId1);

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(buildAccountCreateOutput());
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });

  test("accountId has invalid format => 400", async () => {
    const res = await getAccountRequest("abc");

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  test("Account not found for accountId => 404", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await getAccountRequest(mockMissingAccountId);

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  it('should return 401 given missing token', async () => {
    const res = await request(app).get(`/accounts/${mockAccountId1}`);

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });
});
