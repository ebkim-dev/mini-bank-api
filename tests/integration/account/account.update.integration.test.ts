import request from "supertest";
import { createApp } from "../../../src/app";
import { Prisma } from "../../../src/generated/client";
import { AccountStatus } from "../../../src/generated/enums";
import { buildAccountRecord } from "../../accountMock";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { 
  mockAccountId1,
  mockMissingAccountId,
  mockMissingCustomerId,
  mockRedisKey,
  mockSessionId
} from "../../commonMock";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn() }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: { account: {
    findUnique: jest.fn(),
    update: jest.fn(),
  } }
}));
import prismaClient from "../../../src/db/prismaClient";

const app = createApp();

const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockUpdate = prismaClient.account.update as jest.Mock;
const mockRedisGet = redisClient.get as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  mockUpdate.mockResolvedValue(buildAccountRecord());
  mockRedisGet.mockResolvedValue(mockEncryptedRedisPayload);
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
});

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
  
describe("PUT /accounts/:accountId", () => {

  test("nickname and status are both given => 200, account is updated and returned", async () => {
    const toUpdate = { nickname: "newNick", status: AccountStatus.CLOSED };

    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockUpdate.mockResolvedValue(buildAccountRecord(toUpdate));

    const res = await updateAccountRequest(toUpdate);

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(toUpdate);
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("nickname only is given => 200, account is updated and returned", async () => {
    const toUpdate = { nickname: "onlyNick" };
    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockUpdate.mockResolvedValue(buildAccountRecord(toUpdate));

    const res = await updateAccountRequest(toUpdate);

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(toUpdate);
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("status only is given => 200, account is updated and returned", async () => {
    const toUpdate = { status: AccountStatus.CLOSED };
    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockUpdate.mockResolvedValue(buildAccountRecord(toUpdate));

    const res = await updateAccountRequest(toUpdate);

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(toUpdate);
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("Empty body is given => 400, atleast one field required", async () => {
    const res = await updateAccountRequest({});

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
  });

  test("accountId has invalid format => 400", async () => {
    const res = await updateAccountRequest({ nickname: "x" }, "abc");

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
  });

  test("Large input string is given (longer than maxLength) => 400", async () => {
    const longNickname = "a".repeat(500);
    const res = await updateAccountRequest({ nickname: longNickname });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
  });

  test("Account not found for accountId => 404", async () => {
    const mockError = { code: "P2025" } as any;
    Object.setPrototypeOf(
      mockError, Prisma.PrismaClientKnownRequestError.prototype
    );
    mockFindUnique.mockResolvedValue(null);

    const res = await updateAccountRequest(
      { nickname: "x" }, mockMissingAccountId
    );

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(0);
  });

  it('should return 401 given invalid session ID', async () => {
    const res = await updateAccountRequest(
      { nickname: "newName" }, mockAccountId1, "WRONG_SESSION_ID"
    );

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });
  
  test("Account not owned by customer => 403", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput({
      customerId: mockMissingCustomerId
    })));

    const res = await updateAccountRequest(
      { nickname: "x" }, mockAccountId1
    );

    expect(res.status).toBe(403);
    expect(res.headers).toHaveProperty("x-trace-id");
      
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(0);
  });
});
