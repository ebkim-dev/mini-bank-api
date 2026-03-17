import request from "supertest";
import { createApp } from "../../../src/app";
import { Decimal } from "@prisma/client/runtime/client";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { AccountStatus, TransactionType } from "../../../src/generated/enums";
import { buildTransactionRecord, mockTransactionId2 } from "../../transactionMock";
import { buildTransferCreateRequestBody, buildTransferOutput, buildTransferRecord } from "../../transferMock";
import { 
  buildAccountCreateOutput,
  buildAccountCreateRequestBody,
  buildAccountRecord,
} from "../../accountMock";
import {
  mockAccountId1,
  mockAccountId2,
  mockCustomerId2,
  mockRedisKey,
  mockSessionId
} from "../../commonMock";
import { 
  throwIfAccountNotActive,
  throwIfAccountNotFound,
  throwIfInsufficientFunds,
  throwIfNotAccountOwner,
  throwIfSelfTransfer
} from "../../../src/utils/serviceAssertions";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { get: jest.fn() }
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
import { logger } from "../../../src/logging/logger";
import { ForbiddenError, NotFoundError } from "../../../src/error/error";
import { EventCode } from "../../../src/types/eventCodes";

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

(prismaClient.$transaction as jest.Mock).mockImplementation(cb => cb(mockTx));

beforeEach(() => {
  jest.clearAllMocks();

  mockRedisGet.mockResolvedValue(mockEncryptedRedisPayload);
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
  
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
  body: any,
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
    const mockTransferCreateRequestBody = buildTransferCreateRequestBody(memoOverride);
    const mockTransferCreateOutput = buildTransferOutput(memoOverride);
    mockCreate.mockResolvedValue(buildTransferRecord(memoOverride));

    const res = await postTransferRequest(mockTransferCreateRequestBody);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(mockTransferCreateOutput);

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockTx.transfer.create).toHaveBeenCalledTimes(1);
  });

  it("should create transfer given input without memo", async () => {
    const mockTransferCreateRequestBody = buildTransferCreateRequestBody();
    const mockTransferCreateOutput = buildTransferOutput();
    mockCreate.mockResolvedValue(buildTransferRecord());

    const res = await postTransferRequest(mockTransferCreateRequestBody);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(mockTransferCreateOutput);

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockTx.transfer.create).toHaveBeenCalledTimes(1);
  });

  it("should throw 404 if source account is not found", async () => {
    mockTx.account.findUnique.mockResolvedValueOnce(null);

    const res = await postTransferRequest(buildTransferCreateRequestBody());

    expect(res.status).toBe(404);

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
  });

  // ==== start from here ====

  it("should throw 403 if account ownership check fails", async () => {
    mockTx.account.findUnique.mockResolvedValueOnce(null);

    // how to mock redis for fake customer id?

    const res = await postTransferRequest(buildTransferCreateRequestBody());

    expect(res.status).toBe(404);

    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
  });

  it("should throw 404 if destination account is not found", async () => {
    (throwIfAccountNotFound as jest.Mock).mockImplementation(() => {
      throw NotFoundError(
        EventCode.ACCOUNT_NOT_FOUND,
        "Account not found"
      )
    });

    await expect(transferService.insertTransfer(
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.ACCOUNT_NOT_FOUND
    });

    expect(throwIfAccountNotFound).toHaveBeenCalledTimes(2);
    expect(throwIfNotAccountOwner).toHaveBeenCalledTimes(1);

    expect(mockTx.account.findUnique).toHaveBeenCalledTimes(2);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 409 if self transfer is attempted", async () => {
    (throwIfSelfTransfer as jest.Mock).mockImplementation(() => {
      throw ConflictError(
        EventCode.NO_SELF_TRANSFER_ALLOWED,
        "Self-transfers are not allowed"
      )
    });

    await expect(transferService.insertTransfer(
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.NO_SELF_TRANSFER_ALLOWED
    });

    expect(throwIfAccountNotFound).toHaveBeenCalledTimes(2);
    expect(throwIfNotAccountOwner).toHaveBeenCalledTimes(1);
    expect(throwIfSelfTransfer).toHaveBeenCalledTimes(1);

    expect(mockTx.account.findUnique).toHaveBeenCalledTimes(2);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 409 if source account is not active", async () => {
    (throwIfAccountNotActive as jest.Mock).mockImplementation(() => {
      throw ConflictError(
        EventCode.ACCOUNT_NOT_ACTIVE,
        "Account is not active"
      )
    });

    await expect(transferService.insertTransfer(
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.ACCOUNT_NOT_ACTIVE
    });

    expect(throwIfAccountNotFound).toHaveBeenCalledTimes(2);
    expect(throwIfNotAccountOwner).toHaveBeenCalledTimes(1);
    expect(throwIfSelfTransfer).toHaveBeenCalledTimes(1);
    expect(throwIfAccountNotActive).toHaveBeenCalledTimes(1);

    expect(mockTx.account.findUnique).toHaveBeenCalledTimes(2);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 409 if destination account is not active", async () => {
    (throwIfAccountNotActive as jest.Mock).mockImplementation(() => {
      throw ConflictError(
        EventCode.ACCOUNT_NOT_ACTIVE,
        "Account is not active"
      )
    });

    await expect(transferService.insertTransfer(
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.ACCOUNT_NOT_ACTIVE
    });

    expect(throwIfAccountNotFound).toHaveBeenCalledTimes(2);
    expect(throwIfNotAccountOwner).toHaveBeenCalledTimes(1);
    expect(throwIfSelfTransfer).toHaveBeenCalledTimes(1);
    expect(throwIfAccountNotActive).toHaveBeenCalledTimes(2);

    expect(mockTx.account.findUnique).toHaveBeenCalledTimes(2);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });

  it("should throw 409 if source account is out of funds", async () => {
    (throwIfInsufficientFunds as jest.Mock).mockImplementation(() => {
      throw ConflictError(
        EventCode.INSUFFICIENT_FUNDS,
        "Insufficient funds"
      )
    });

    await expect(transferService.insertTransfer(
      buildTransferCreateInput(),
      buildAuthInput()
    )).rejects.toMatchObject({
      code: EventCode.INSUFFICIENT_FUNDS
    });

    expect(throwIfAccountNotFound).toHaveBeenCalledTimes(2);
    expect(throwIfNotAccountOwner).toHaveBeenCalledTimes(1);
    expect(throwIfSelfTransfer).toHaveBeenCalledTimes(1);
    expect(throwIfAccountNotActive).toHaveBeenCalledTimes(2);
    expect(throwIfInsufficientFunds).toHaveBeenCalledTimes(1);

    expect(mockTx.account.findUnique).toHaveBeenCalledTimes(2);
    expect(mockTx.transfer.create).not.toHaveBeenCalled();
    expect(mockTx.account.update).not.toHaveBeenCalled();
    expect(mockTx.transaction.create).not.toHaveBeenCalled();
  });
});







// =========================




const mockCreate = prismaClient.account.create as jest.Mock;
const mockRedisGet = redisClient.get as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  mockRedisGet.mockResolvedValue(mockEncryptedRedisPayload);
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
});

describe("POST /accounts", () => {
  async function postAccountRequest(
    body: any, 
    sessionId = mockSessionId
  ) {
    return request(app)
      .post("/accounts")
      .set("x-session-id", sessionId)
      .send(body);
  }

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
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("Optional fields missing => 201, new account is created and returned", async () => {
    mockCreate.mockResolvedValue(buildAccountRecord());
    const res = await postAccountRequest(buildAccountCreateRequestBody());

    expect(res.status).toBe(201);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(buildAccountCreateOutput());
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("A required field is missing => 400", async () => {
    const { currency, ...badInput } = buildAccountCreateRequestBody();
    const res = await postAccountRequest(badInput);

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("Empty body is given => 400", async () => {
    const res = await postAccountRequest({});

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('Wrong field type is given (e.g. passing "abc" to customer_id) => 400', async () => {
    const res = await postAccountRequest({ customer_id: "abc" });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("Large input string is given (longer than maxLength) => 400", async () => {
    const res = await postAccountRequest({ nickname: "a".repeat(500) });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('Invalid enum value - type = "SAVINGSS" => 400', async () => {
    const res = await postAccountRequest({ type: "SAVINGSS" as any });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('Invalid enum value - status = "OPEN" => 400', async () => {
    const res = await postAccountRequest({ status: "OPEN" as any });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('Invalid currency format - currency="US" => 400', async () => {
    const res = await postAccountRequest({ currency: "US" });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('Invalid currency format - currency="USDD" => 400', async () => {
    const res = await postAccountRequest({ currency: "USDD" });

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(redisClient.get).toHaveBeenCalledWith(mockRedisKey);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should return 401 given missing header', async () => {
    const res = await postAccountRequest(buildAccountCreateRequestBody(), "");

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
