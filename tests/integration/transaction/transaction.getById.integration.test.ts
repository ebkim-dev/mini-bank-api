import request from "supertest";
import { createApp } from "../../../src/app";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import {
  buildTransactionOutput,
  buildTransactionRecord,
} from "../../transactionMock";
import {
  mockAccountId1,
  mockMissingTransactionId,
  mockSessionId,
  mockTransactionId1
} from "../../commonMock";

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
  default: {
    transaction: { findUnique: jest.fn() },
  }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";
import { buildAccountRecord } from "../../accountMock";

const app = createApp();

const mockFindUnique = prismaClient.transaction.findUnique as jest.Mock;
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

async function getTransactionRequest(
  accountId: string,
  transactionId: string
) {
  return request(app)
    .get(`/accounts/${accountId}/transactions/${transactionId}`)
    .set("x-session-id", mockSessionId);
}

describe("GET /accounts/:accountId/transactions/:transactionId", () => {
  test("Transaction found => 200, transaction is returned", async () => {
    mockFindUnique.mockResolvedValue({
      ...buildTransactionRecord(),
      account: buildAccountRecord({ id: mockAccountId1 })
    });

    const res = await getTransactionRequest(mockAccountId1, mockTransactionId1);

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject({
      ...buildTransactionOutput(),
      created_at: buildTransactionOutput().created_at.toISOString(),
    });
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });

  test("Invalid UUID transactionId => 400", async () => {
    const res = await getTransactionRequest(mockAccountId1, "not-a-uuid");

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  test("Invalid UUID accountId => 400", async () => {
    const res = await getTransactionRequest("not-a-uuid", mockTransactionId1);

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  test("Transaction not found => 404", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await getTransactionRequest(mockAccountId1, mockMissingTransactionId);

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body.code).toBe("TRANSACTION_NOT_FOUND");
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
  });

  it("should return 401 given missing session", async () => {
    const res = await request(app)
      .get(`/accounts/${mockAccountId1}/transactions/${mockTransactionId1}`);

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});