import request from "supertest";
import { createApp } from "../../../src/app";
import { Decimal } from "@prisma/client/runtime/client";
import { logger } from "../../../src/logging/logger";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { AccountStatus, TransactionType } from "../../../src/generated/enums";
import { buildTransactionRecord } from "../../transactionMock";
import { buildTransferCreateRequestBody, buildTransferOutput, buildTransferRecord, TransferCreateRequestBody } from "../../transferMock";
import { 
  buildAccountRecord,
} from "../../accountMock";
import {
  mockAccountId1,
  mockAccountId2,
  mockCustomerId2,
  mockMissingCustomerId,
  mockSessionId,
  mockTransactionId2
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
  default: { $transaction: jest.fn() }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";

const app = createApp();

const mockTx = {
  account: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  transfer: {
    create: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
  },
};

const mockTransaction = prismaClient.$transaction as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();

  (redisClient.multi as jest.Mock).mockReturnValue({
    get: jest.fn().mockReturnThis(),
    ttl: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([mockEncryptedRedisPayload, 999]),
  });
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));

  mockTransaction.mockImplementation(cb => cb(mockTx));
  
  mockTx.account.findUnique
    .mockResolvedValueOnce(buildAccountRecord({
      balance: new Decimal(1000)
    }))
    .mockResolvedValueOnce(buildAccountRecord({
      id: mockAccountId2,
      customer_id: mockCustomerId2,
    }));

  mockTx.transfer.create
    .mockResolvedValueOnce(buildTransferRecord());

  mockTx.account.update
    .mockResolvedValueOnce(buildAccountRecord({
      balance: new Decimal(950)
    }))
    .mockResolvedValueOnce(buildAccountRecord({
      id: mockAccountId2,
      customer_id: mockCustomerId2,
      balance: new Decimal(50)
    }));

  mockTx.transaction.create
    .mockResolvedValueOnce(buildTransactionRecord({
      type: TransactionType.DEBIT,
    }))
    .mockResolvedValueOnce(buildTransactionRecord({
      id: mockTransactionId2,
      account_id: mockAccountId2,
    }));

  jest.spyOn(logger, "info").mockReturnValue(logger);
});

async function postTransferRequest(
  body: TransferCreateRequestBody,
  accountId = mockAccountId1,
  sessionId = mockSessionId
) {
  return request(app)
    .post(`/accounts/${accountId}/transfers`)
    .set("x-session-id", sessionId)
    .send(body);
}

describe("POST /accounts/:accountId/transfers", () => {
  it("should create transfer given valid inputs", async () => {
    const memoOverride = { memo: "fooMemo" };
    mockTx.transfer.create.mockReset();
    mockTx.transfer.create.mockResolvedValueOnce(
      buildTransferRecord(memoOverride)
    );

    const res = await postTransferRequest(
      buildTransferCreateRequestBody(memoOverride)
    );

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(buildTransferOutput(memoOverride));

    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockTx.transfer.create).toHaveBeenCalledTimes(1);

    expect(mockTx.transaction.create).toHaveBeenCalledTimes(2);
    expect(mockTx.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: TransactionType.DEBIT
        })
      })
    );
    expect(mockTx.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: TransactionType.CREDIT
        })
      })
    );
  });

  it("should create transfer given input without memo", async () => {
    const res = await postTransferRequest(buildTransferCreateRequestBody());

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(buildTransferOutput());

    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockTx.transfer.create).toHaveBeenCalledTimes(1);

    expect(mockTx.transaction.create).toHaveBeenCalledTimes(2);
    expect(mockTx.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: TransactionType.DEBIT
        })
      })
    );
    expect(mockTx.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: TransactionType.CREDIT
        })
      })
    );
  });

  it("should return 401 if session header is missing", async () => {
    const res = await request(app)
      .post(`/accounts/${mockAccountId1}/transfers`)
      .send(buildTransferCreateRequestBody());

    expect(res.status).toBe(401);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
  });

  it("should return 400 if self transfer is attempted", async () => {
    const res = await postTransferRequest(
      buildTransferCreateRequestBody({ toAccountId: mockAccountId1 })
    );

    expect(res.status).toBe(400);
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
  });

  it("should return 404 if source account is not found", async () => {
    mockTx.account.findUnique.mockReset();
    mockTx.account.findUnique.mockResolvedValueOnce(null);

    const res = await postTransferRequest(buildTransferCreateRequestBody());

    expect(res.status).toBe(404);
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
  });

  it("should return 403 if account ownership check fails", async () => {
    mockDecrypt.mockReturnValue(JSON.stringify(
      buildAuthInput({ customerId: mockMissingCustomerId })
    ));

    const res = await postTransferRequest(buildTransferCreateRequestBody());

    expect(res.status).toBe(403);
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
  });

  it("should return 409 if source account is not active", async () => {
    mockTx.account.findUnique.mockReset();
    mockTx.account.findUnique
      .mockResolvedValueOnce(buildAccountRecord({
        status: AccountStatus.CLOSED,
        balance: new Decimal(1000)
      }));

    const res = await postTransferRequest(buildTransferCreateRequestBody());

    expect(res.status).toBe(409);
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
  });

  it("should return 409 if source account is out of funds", async () => {
    mockTx.account.findUnique.mockReset();
    mockTx.account.findUnique.mockResolvedValueOnce(
      buildAccountRecord({ balance: new Decimal(0) })
    );

    const res = await postTransferRequest(buildTransferCreateRequestBody());

    expect(res.status).toBe(409);
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
  });

  it("should return 404 if destination account is not found", async () => {
    mockTx.account.findUnique.mockReset();
    mockTx.account.findUnique
      .mockResolvedValueOnce(buildAccountRecord({
        balance: new Decimal(1000)
      }))
      .mockResolvedValueOnce(null);

    const res = await postTransferRequest(buildTransferCreateRequestBody());

    expect(res.status).toBe(404);
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
  });

  it("should return 409 if destination account is not active", async () => {
    mockTx.account.findUnique.mockReset();
    mockTx.account.findUnique
      .mockResolvedValueOnce(buildAccountRecord({
        balance: new Decimal(1000)
      }))
      .mockResolvedValueOnce(buildAccountRecord({
        status: AccountStatus.CLOSED,
        balance: new Decimal(0)
      }));

    const res = await postTransferRequest(buildTransferCreateRequestBody());

    expect(res.status).toBe(409);
    expect(redisClient.multi).toHaveBeenCalledTimes(1);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
  });

  it("should return 500 if prisma throws", async () => {
    mockTransaction.mockImplementationOnce(() => {
      throw new Error("DB failure");
    });

    const res = await postTransferRequest(buildTransferCreateRequestBody());
    
    expect(res.status).toBe(500);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
  });

  it("should abort the operation via rollback if failure is encountered", async () => {
    mockTx.account.update.mockReset();
    mockTx.account.update.mockRejectedValue(new Error("DB failure"));

    const res = await postTransferRequest(buildTransferCreateRequestBody());
    
    expect(res.status).toBe(500);
    expect(mockTx.account.update).toHaveBeenCalledTimes(1);
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });
});