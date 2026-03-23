import request from "supertest";
import { createApp } from "../../../src/app";
import { Decimal } from "@prisma/client/runtime/client";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { AccountStatus, TransactionType } from "../../../src/generated/enums";
import { buildAccountRecord } from "../../accountMock";
import {
  buildTransactionOutput,
  buildTransactionRecord,
} from "../../transactionMock";
import {
  mockAccountId1,
  mockMissingAccountId,
  mockRedisKey,
  mockSessionId
} from "../../commonMock";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn() }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
  }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";

const app = createApp();

const mockPrismaTransaction = prismaClient.$transaction as jest.Mock;
const mockRedisGet = redisClient.get as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;

type TxMock = {
  account: {
    findUnique: jest.Mock;
    update: jest.Mock
  };
  transaction: { create: jest.Mock };
};

let txMock: TxMock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRedisGet.mockResolvedValue(mockEncryptedRedisPayload);
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));

  txMock = {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
  };

  mockPrismaTransaction.mockImplementation(
    async (callback: (tx: TxMock) => unknown) => {
      return callback(txMock);
    }
  );
});

async function postTransactionRequest(
  accountId: string,
  body: any,
  sessionId = mockSessionId
) {
  return request(app)
    .post(`/accounts/${accountId}/transactions`)
    .set("x-session-id", sessionId)
    .send(body);
}

describe("POST /accounts/:accountId/transactions", () => {
  test("Correct CREDIT input => 201, transaction created and returned", async () => {
    txMock.account.findUnique.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("250.00") })
    );
    txMock.transaction.create.mockResolvedValue(buildTransactionRecord());
    txMock.account.update.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("350.00") })
    );

    const res = await postTransactionRequest(mockAccountId1, {
      type: TransactionType.CREDIT,
      amount: "100.00",
      description: "mock transaction description",
      category: "mock category",
    });

    expect(res.status).toBe(201);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject({
      ...buildTransactionOutput(),
      created_at: buildTransactionOutput().created_at.toISOString(),
    });
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
  });

  test("Correct DEBIT input => 201, transaction created and returned", async () => {
    txMock.account.findUnique.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("500.00") })
    );
    txMock.transaction.create.mockResolvedValue(
      buildTransactionRecord({
        type: TransactionType.DEBIT,
        amount: new Decimal("50.00"),
      })
    );
    txMock.account.update.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("450.00") })
    );

    const res = await postTransactionRequest(mockAccountId1, {
      type: TransactionType.DEBIT,
      amount: "50.00",
    });

    expect(res.status).toBe(201);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body.type).toBe(TransactionType.DEBIT);
  });

  test("Optional fields missing => 201, transaction created with nulls", async () => {
    txMock.account.findUnique.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("100.00") })
    );
    txMock.transaction.create.mockResolvedValue(
      buildTransactionRecord({ description: null, category: null })
    );
    txMock.account.update.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("200.00") })
    );

    const res = await postTransactionRequest(mockAccountId1, {
      type: TransactionType.CREDIT,
      amount: "100.00",
    });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe("");
    expect(res.body.category).toBe("");
  });

  test("Missing required field (type) => 400", async () => {
    const res = await postTransactionRequest(mockAccountId1, {
      amount: "100.00",
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  test("Missing required field (amount) => 400", async () => {
    const res = await postTransactionRequest(mockAccountId1, {
      type: TransactionType.CREDIT,
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  test("Empty body => 400", async () => {
    const res = await postTransactionRequest(mockAccountId1, {});

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  test("Invalid accountId in path => 400", async () => {
    const res = await postTransactionRequest("not-a-uuid", {
      type: TransactionType.CREDIT,
      amount: "100.00",
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  test("account_id in body rejected (strict) => 400", async () => {
    const res = await postTransactionRequest(mockAccountId1, {
      account_id: mockAccountId1,
      type: TransactionType.CREDIT,
      amount: "100.00",
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  test("Invalid enum type => 400", async () => {
    const res = await postTransactionRequest(mockAccountId1, {
      type: "TRANSFER",
      amount: "100.00",
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  test("Negative amount => 400", async () => {
    const res = await postTransactionRequest(mockAccountId1, {
      type: TransactionType.CREDIT,
      amount: "-50.00",
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  test("Zero amount => 400", async () => {
    const res = await postTransactionRequest(mockAccountId1, {
      type: TransactionType.CREDIT,
      amount: "0",
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  test("Extra fields => 400", async () => {
    const res = await postTransactionRequest(mockAccountId1, {
      type: TransactionType.CREDIT,
      amount: "100.00",
      extra: "nope",
    });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  test("Account not found => 404", async () => {
    txMock.account.findUnique.mockResolvedValue(null);

    const res = await postTransactionRequest(mockMissingAccountId, {
      type: TransactionType.CREDIT,
      amount: "100.00",
    });

    expect(res.status).toBe(404);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Account not active => 409", async () => {
    txMock.account.findUnique.mockResolvedValue(
      buildAccountRecord({ status: AccountStatus.CLOSED })
    );

    const res = await postTransactionRequest(mockAccountId1, {
      type: TransactionType.CREDIT,
      amount: "100.00",
    });

    expect(res.status).toBe(409);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body.code).toBe("ACCOUNT_NOT_ACTIVE");
  });

  test("Insufficient funds on DEBIT => 409", async () => {
    txMock.account.findUnique.mockResolvedValue(
      buildAccountRecord({ balance: new Decimal("10.00") })
    );

    const res = await postTransactionRequest(mockAccountId1, {
      type: TransactionType.DEBIT,
      amount: "999.00",
    });

    expect(res.status).toBe(409);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body.code).toBe("INSUFFICIENT_FUNDS");
  });

  it("should return 401 given missing session", async () => {
    const res = await postTransactionRequest(
      mockAccountId1,
      { type: TransactionType.CREDIT, amount: "100.00" },
      ""
    );

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });
});