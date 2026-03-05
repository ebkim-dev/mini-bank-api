import request from "supertest";
import { createApp } from "../../../src/app";
import { Prisma } from "../../../src/generated/client";
import { UserRole, AccountStatus } from "../../../src/generated/enums";
import { 
  buildMockAccountRecord,
  buildJwtPayload,
} from "./account.mock.integration";

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
import { mockAccountId1, mockMissingAccountId, mockRedisKey, mockSessionId } from "../../common.mock";


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

describe("PUT /accounts/:accountId", () => {
  async function updateAccountRequest(
    body: any,
    accountId: string = mockAccountId1,
    sessionId: string = mockSessionId
  ) {
    return request(app)
      .put(`/accounts/${accountId}`)
      .set("x-session-id", sessionId)
      .send(body);
  }

  test("nickname and status are both given => 200, account is updated and returned", async () => {
    const toUpdate = { nickname: "newNick", status: AccountStatus.CLOSED };

    mockUpdate.mockResolvedValue(buildMockAccountRecord(toUpdate));

    const res = await updateAccountRequest(toUpdate);

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(toUpdate);
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("nickname only is given => 200, account is updated and returned", async () => {
    const toUpdate = { nickname: "onlyNick" };
    mockUpdate.mockResolvedValue(buildMockAccountRecord(toUpdate));

    const res = await updateAccountRequest(toUpdate);

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(toUpdate);
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("status only is given => 200, account is updated and returned", async () => {
    const toUpdate = { status: AccountStatus.CLOSED };
    mockUpdate.mockResolvedValue(buildMockAccountRecord(toUpdate));

    const res = await updateAccountRequest(toUpdate);

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(toUpdate);
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("Empty body is given => 400, atleast one field required", async () => {
    const res = await updateAccountRequest({});

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  test("accountId has invalid format => 400", async () => {
    const res = await updateAccountRequest({ nickname: "x" }, "abc");

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  test("Large input string is given (longer than maxLength) => 400", async () => {
    const longNickname = "a".repeat(500);
    const res = await updateAccountRequest({ nickname: longNickname });

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

    const res = await updateAccountRequest(
      { nickname: "x" }, 
      mockMissingAccountId
    );

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('should return 401 given invalid token', async () => {
    const res = await updateAccountRequest(
      { nickname: "newName" },
      mockAccountId1,
      "WRONG_SESSION_ID"
    );

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  it('should return 403 given STANDARD role', async() => {
    mockVerify.mockReturnValue(mockedJwtPayloadStandard);
    const res = await updateAccountRequest({ nickname: "newName" });

    expect(res.status).toBe(403);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });
});
