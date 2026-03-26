import request from "supertest";
import { createApp } from "../../../src/app";
import { Decimal } from "@prisma/client/runtime/client";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { AccountStatus } from "../../../src/generated/enums";
import { 
  buildAccountCreateOutput,
  buildAccountCreateRequestBody,
  buildAccountRecord,
} from "../../accountMock";
import { mockSessionId } from "../../commonMock";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: {
    multi: jest.fn(() => ({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    })),
    expire: jest.fn(),
  }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: { account: { create: jest.fn() } }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";

const app = createApp();

const mockCreate = prismaClient.account.create as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  (redisClient.multi as jest.Mock).mockReturnValue({
    get: jest.fn().mockReturnThis(),
    ttl: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([mockEncryptedRedisPayload, 999]),
  });
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
});

async function postAccountRequest(
  body: any, 
  sessionId = mockSessionId
){
  return request(app)
    .post("/accounts")
    .set("x-session-id", sessionId)
    .send(body);
}

describe("POST /accounts", () => {

  test("Correct input => 201, new account is created and returned", async () => {
    const mockAccountCreateRequestBody = buildAccountCreateRequestBody({
      nickname: "alice",
      status: AccountStatus.ACTIVE,
      balance: (new Decimal(0)).toString()
    });
    const mockAccountCreateOutput = buildAccountCreateOutput({
      nickname: "alice"
    });
    mockCreate.mockResolvedValue(buildAccountRecord({
      nickname: "alice"
    }));

    const res = await postAccountRequest(mockAccountCreateRequestBody);

    expect(res.status).toBe(201);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(mockAccountCreateOutput);
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("Optional fields missing => 201, new account is created and returned", async () => {
    mockCreate.mockResolvedValue(buildAccountRecord());
    const res = await postAccountRequest(buildAccountCreateRequestBody());

    expect(res.status).toBe(201);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(buildAccountCreateOutput());
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("A required field is missing => 400", async () => {
    const { currency, ...badInput } = buildAccountCreateRequestBody();
    const res = await postAccountRequest(badInput);

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("Empty body is given => 400", async () => {
    const res = await postAccountRequest({});

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('Wrong field type is given (e.g. passing "abc" to customer_id) => 400', async () => {
    const res = await postAccountRequest({ customer_id: "abc" });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("Large input string is given (longer than maxLength) => 400", async () => {
    const res = await postAccountRequest({ nickname: "a".repeat(500) });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('Invalid enum value - type = "SAVINGSS" => 400', async () => {
    const res = await postAccountRequest({ type: "SAVINGSS" as any });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('Invalid enum value - status = "OPEN" => 400', async () => {
    const res = await postAccountRequest({ status: "OPEN" as any });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('Invalid currency format - currency="US" => 400', async () => {
    const res = await postAccountRequest({ currency: "US" });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('Invalid currency format - currency="USDD" => 400', async () => {
    const res = await postAccountRequest({ currency: "USDD" });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should return 401 given missing header', async () => {
    const res = await postAccountRequest(buildAccountCreateRequestBody(), "");

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockCreate).not.toHaveBeenCalled();
  });
});