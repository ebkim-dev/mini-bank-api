import request from "supertest";
import { createApp } from "../../../src/app";
import { Decimal } from "@prisma/client/runtime/client";
import { JwtPayload } from "../../../src/auth/user";
import { UserRole, AccountStatus } from "../../../src/generated/enums";
import { 
  buildAccountCreateInput, 
  buildAccountCreateOutput,
  buildMockAccountRecord,
  buildJwtPayload,
  mockSessionId,
  mockRedisKey
} from "./account.mock";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn().mockResolvedValue("mock_jwt_token") }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: { account: { create: jest.fn() } }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("jsonwebtoken");
import jwt from "jsonwebtoken";

const app = createApp();
const mockedJwtPayloadAdmin: JwtPayload = buildJwtPayload();
const mockedJwtPayloadStandard: JwtPayload = buildJwtPayload({ 
  role: UserRole.STANDARD
});

const mockCreate = prismaClient.account.create as jest.Mock;
const mockVerify = jwt.verify as jest.Mock;
beforeEach(async () => {
  jest.clearAllMocks();
  mockVerify.mockReturnValue(mockedJwtPayloadAdmin);
});

describe("POST /accounts", () => {
  async function postAccount(
    body: any, 
    sessionId = mockSessionId
  ) {
    return request(app)
      .post("/accounts")
      .set("x-session-id", sessionId)
      .send(body);
  }
  
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

    const res = await postAccount(mockAccountCreateInput);

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

    const res = await postAccount(mockAccountCreateInput);

    expect(res.status).toBe(201);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(mockAccountCreateOutput);

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("A required field is missing => 400", async () => {
    const { currency, ...badInput } = buildAccountCreateInput();

    const res = await postAccount(badInput);

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  test("Empty body is given => 400", async () => {
    const res = await postAccount({});

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  test('Wrong field type is given (e.g. passing "abc" to customer_id) => 400', async () => {
    const res = await postAccount({ customer_id: "abc" });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  test("Large input string is given (longer than maxLength) => 400", async () => {
    const longNickname = "a".repeat(500);

    const res = await postAccount({ nickname: longNickname });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  test('Invalid enum value - type = "SAVINGSS" => 400', async () => {
    const res = await postAccount({ type: "SAVINGSS" as any });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  test('Invalid enum value - status = "OPEN" => 400', async () => {
    const res = await postAccount({ status: "OPEN" as any });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  test('Invalid currency format - currency="US" => 400', async () => {
    const res = await postAccount({ currency: "US" });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  test('Invalid currency format - currency="USDD" => 400', async () => {
    const res = await postAccount({ currency: "USDD" });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });

  it('should return 401 given missing header', async () => {
    const mockAccountCreateInput = buildAccountCreateInput();

    const res = await postAccount(mockAccountCreateInput, "");

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  it('should return 403 given STANDARD role', async() => {
    const mockAccountCreateInput = buildAccountCreateInput();
    mockVerify.mockReturnValue(mockedJwtPayloadStandard);

    const res = await postAccount(mockAccountCreateInput);

    expect(res.status).toBe(403);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockVerify).toHaveBeenCalled();
  });
});
