import request from "supertest";
import { Decimal } from "@prisma/client/runtime/client";
import { createApp } from "../../../src/app";
import { AccountStatus, AccountType } from "../../../src/generated/enums";
import { buildAccountRecord } from "../../accountMock";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import {
  mockAccountId1,
  mockMissingAccountId,
  mockMissingCustomerId,
  mockRedisKey,
  mockSessionId,
} from "../../commonMock";
import { buildTransactionRecord } from "../../transactionMock";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn(),
}));
import { decrypt } from "../../../src/utils/encryption";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn() },
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
      groupBy: jest.fn(),
    },
  },
}));
import prismaClient from "../../../src/db/prismaClient";

const app = createApp();

const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockTransactionFindMany = prismaClient.transaction.findMany as jest.Mock;
const mockTransactionGroupBy = prismaClient.transaction.groupBy as jest.Mock;
const mockRedisGet = redisClient.get as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRedisGet.mockResolvedValue(mockEncryptedRedisPayload);
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
});

async function getAccountSummaryRequest(
  accountId: string = mockAccountId1,
  sessionId: string = mockSessionId
) {
  return request(app)
    .get(`/accounts/${accountId}/summary`)
    .set("x-session-id", sessionId);
}

describe("GET /accounts/:accountId/summary", () => {
  test("Account summary found for accountId => 200, summary is returned", async () => {
    const mockAccount = buildAccountRecord({
      balance: new Decimal("450.00"),
      status: AccountStatus.ACTIVE,
    });

    const mockTransaction1 = buildTransactionRecord({
      amount: new Decimal("100.00"),
      description: "mock transaction description",
    });

    const mockTransaction2 = buildTransactionRecord({
      id: "550e8400-e29b-41d4-a716-446655440031",
      type: "DEBIT" as any,
      amount: new Decimal("50.00"),
      description: "ATM withdrawal",
    });

    mockFindUnique.mockResolvedValue(mockAccount);
    mockTransactionFindMany.mockResolvedValue([
      mockTransaction1,
      mockTransaction2,
    ]);
    mockTransactionGroupBy.mockResolvedValue([
      { type: "CREDIT", _count: { type: 1 } },
      { type: "DEBIT", _count: { type: 1 } },
    ]);

    const res = await getAccountSummaryRequest();

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(res.body).toEqual({
      account_id: mockAccountId1,
      type: AccountType.SAVINGS,
      currency: "USD",
      status: AccountStatus.ACTIVE,
      balance: "450",
      total_credits: 1,
      total_debits: 1,
      recent_transactions: [
        {
          id: mockTransaction1.id,
          type: mockTransaction1.type,
          amount: "100",
          description: "mock transaction description",
          created_at: mockTransaction1.created_at.toISOString(),
        },
        {
          id: mockTransaction2.id,
          type: mockTransaction2.type,
          amount: "50",
          description: "ATM withdrawal",
          created_at: mockTransaction2.created_at.toISOString(),
        },
      ],
    });

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockTransactionFindMany).toHaveBeenCalledTimes(1);
    expect(mockTransactionGroupBy).toHaveBeenCalledTimes(1);
  });

  test("Account summary found with no transactions => 200, zero counts are returned", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockTransactionFindMany.mockResolvedValue([]);
    mockTransactionGroupBy.mockResolvedValue([]);

    const res = await getAccountSummaryRequest();

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(res.body).toEqual({
      account_id: mockAccountId1,
      type: AccountType.SAVINGS,
      currency: "USD",
      status: AccountStatus.ACTIVE,
      balance: "0",
      total_credits: 0,
      total_debits: 0,
      recent_transactions: [],
    });

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockTransactionFindMany).toHaveBeenCalledTimes(1);
    expect(mockTransactionGroupBy).toHaveBeenCalledTimes(1);
  });

  test("accountId has invalid format => 400", async () => {
    const res = await getAccountSummaryRequest("abc");

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockTransactionFindMany).not.toHaveBeenCalled();
    expect(mockTransactionGroupBy).not.toHaveBeenCalled();
  });

  test("Session ID not passed => 401", async () => {
    const res = await request(app).get(`/accounts/${mockAccountId1}/summary`);

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockTransactionFindMany).not.toHaveBeenCalled();
    expect(mockTransactionGroupBy).not.toHaveBeenCalled();
  });

  test("Account not owned by customer => 403", async () => {
    mockFindUnique.mockResolvedValue(buildAccountRecord());
    mockDecrypt.mockReturnValue(
      JSON.stringify(
        buildAuthInput({
          customerId: mockMissingCustomerId,
        })
      )
    );

    const res = await getAccountSummaryRequest(mockAccountId1);

    expect(res.status).toBe(403);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockTransactionFindMany).not.toHaveBeenCalled();
    expect(mockTransactionGroupBy).not.toHaveBeenCalled();
  });

  test("Account not found for accountId => 404", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await getAccountSummaryRequest(mockMissingAccountId);

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockTransactionFindMany).not.toHaveBeenCalled();
    expect(mockTransactionGroupBy).not.toHaveBeenCalled();
  });
});