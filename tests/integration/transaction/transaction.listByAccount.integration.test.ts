import request from "supertest";
import { createApp } from "../../../src/app";
import { Decimal } from "@prisma/client/runtime/client";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { TransactionType, UserRole } from "../../../src/generated/enums";
import {
  buildTransactionOutput,
  buildTransactionRecord,
  mockTransactionId2,
} from "../../transactionMock";
import { buildAccountRecord } from "../../accountMock";
import {
  mockAccountId1,
  mockMissingAccountId,
  mockMissingCustomerId,
  mockRedisKey,
  mockSessionId,
} from "../../commonMock";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn() }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: {
    account: {
      findUnique: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
  }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";

const app = createApp();

const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockFindMany = prismaClient.transaction.findMany as jest.Mock;
const mockRedisGet = redisClient.get as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRedisGet.mockResolvedValue(mockEncryptedRedisPayload);
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
  mockFindUnique.mockResolvedValue(buildAccountRecord());
});

async function getTransactionsRequest(
  accountId: string,
  query: Record<string, string> = {},
  sessionId: string = mockSessionId
) {
  return request(app)
    .get(`/accounts/${accountId}/transactions`)
    .set("x-session-id", sessionId)
    .query(query);
}

describe("GET /accounts/:id/transactions", () => {
  test("Transactions found => 200, array of transactions returned", async () => {
    mockFindMany.mockResolvedValue([
      buildTransactionRecord(),
      buildTransactionRecord({
        id: mockTransactionId2,
        amount: new Decimal("60.00"),
      }),
    ]);

    const res = await getTransactionsRequest(mockAccountId1);

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toHaveLength(2);

    const expected1 = buildTransactionOutput();
    const expected2 = buildTransactionOutput({
      id: mockTransactionId2,
      amount: "60",
    });

    expect(res.body).toMatchObject([
      { ...expected1, created_at: expected1.created_at.toISOString() },
      { ...expected2, created_at: expected2.created_at.toISOString() },
    ]);

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  test("No transactions found => 200, empty array returned", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await getTransactionsRequest(mockAccountId1);

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toEqual([]);

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  test("Pagination params applied correctly", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await getTransactionsRequest(mockAccountId1, {
      limit: "5",
      offset: "10",
    });

    expect(res.status).toBe(200);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: mockAccountId1 },
    });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        skip: 10,
      })
    );
  });

  test("Type filter applied correctly", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await getTransactionsRequest(mockAccountId1, {
      type: TransactionType.CREDIT,
    });

    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: TransactionType.CREDIT,
        }),
      })
    );
  });

  test("Date range filters applied correctly", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await getTransactionsRequest(mockAccountId1, {
      from: "2026-03-01T00:00:00Z",
      to: "2026-03-31T23:59:59Z",
    });

    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          created_at: {
            gte: new Date("2026-03-01T00:00:00Z"),
            lte: new Date("2026-03-31T23:59:59Z"),
          },
        }),
      })
    );
  });

  test("Account not found => 404", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await getTransactionsRequest(mockMissingAccountId);

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test("Account not owned by customer => 403", async () => {
    mockFindUnique.mockResolvedValue(
      buildAccountRecord({ customer_id: "different-customer-id" })
    );

    mockDecrypt.mockReturnValue(
      JSON.stringify(
        buildAuthInput({
          role: UserRole.STANDARD,
          customerId: mockMissingCustomerId,
        })
      )
    );

    const res = await getTransactionsRequest(mockAccountId1);

    expect(res.status).toBe(403);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test("Invalid account ID format => 400", async () => {
    const res = await getTransactionsRequest("not-a-uuid");

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test("Invalid limit (0) => 400", async () => {
    const res = await getTransactionsRequest(mockAccountId1, {
      limit: "0",
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test("Invalid limit (over 100) => 400", async () => {
    const res = await getTransactionsRequest(mockAccountId1, {
      limit: "101",
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test("Invalid offset (negative) => 400", async () => {
    const res = await getTransactionsRequest(mockAccountId1, {
      offset: "-1",
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test("Invalid type enum => 400", async () => {
    const res = await getTransactionsRequest(mockAccountId1, {
      type: "TRANSFER",
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test("Invalid from date format => 400", async () => {
    const res = await getTransactionsRequest(mockAccountId1, {
      from: "not-a-date",
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test("Extra query params => 400", async () => {
    const res = await getTransactionsRequest(mockAccountId1, {
      extra: "nope",
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 given missing session", async () => {
    const res = await getTransactionsRequest(mockAccountId1, {}, "");

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 given invalid session format", async () => {
    const res = await getTransactionsRequest(
      mockAccountId1,
      {},
      "not-a-uuid-session"
    );

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});