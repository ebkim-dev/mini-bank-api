import * as transactionService from "../../../src/transaction/transactionService";
import * as transactionController from "../../../src/transaction/transactionController";
import { TransactionType } from "../../../src/generated/enums";
import { buildAuthInput } from "../../authMock";
import { mockAccountId1 } from "../../commonMock";
import {
  buildTransactionOutput,
  buildTransactionQueryInput,
  mockMissingTransactionId,
  mockTransactionId1,
  mockTransactionId2,
} from "../../transactionMock";

const mockTransactionOutput1 = buildTransactionOutput({
  id: mockTransactionId1,
});

const mockTransactionOutput2 = buildTransactionOutput({
  id: mockTransactionId2,
  amount: "60",
});

const serviceError = new Error("Service encountered an error");

let next: jest.Mock;
let jsonMock: jest.Mock;
let statusMock: jest.Mock;
let res: any;

beforeEach(() => {
  jest.clearAllMocks();
  next = jest.fn();
  jsonMock = jest.fn();
  statusMock = jest.fn(() => ({ json: jsonMock }));
  res = { status: statusMock };
});

function buildReq(
  overrides: Partial<{ body: any; query: any; params: any; user: any }> = {}
) {
  const { user, ...rest } = overrides;
  return { validated: { ...rest }, user };
}

describe("createTransaction controller", () => {
  it("should merge accountId from params with body and return 201", async () => {
    const req: any = buildReq({
      params: { accountId: mockAccountId1 },
      body: {
        type: TransactionType.CREDIT,
        amount: "100.00",
        description: "mock transaction description",
        category: "mock category",
      },
      user: buildAuthInput(),
    });

    jest
      .spyOn(transactionService, "insertTransaction")
      .mockResolvedValue(mockTransactionOutput1);

    await transactionController.createTransaction(req, res, next);

    expect(transactionService.insertTransaction).toHaveBeenCalledWith(
      {
        account_id: mockAccountId1,
        type: TransactionType.CREDIT,
        amount: "100.00",
        description: "mock transaction description",
        category: "mock category",
      },
      buildAuthInput()
    );
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(mockTransactionOutput1);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const req: any = buildReq({
      params: { accountId: mockAccountId1 },
      body: {
        type: TransactionType.CREDIT,
        amount: "100.00",
      },
      user: buildAuthInput(),
    });

    jest
      .spyOn(transactionService, "insertTransaction")
      .mockRejectedValue(serviceError);

    await transactionController.createTransaction(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(serviceError);
  });
});

describe("getTransactions controller", () => {
  it("should call fetchTransactions and return 200 with empty array if no transactions are found", async () => {
    const req: any = buildReq({
      params: { accountId: mockAccountId1 },
      query: buildTransactionQueryInput(),
      user: buildAuthInput(),
    });

    jest
      .spyOn(transactionService, "fetchTransactions")
      .mockResolvedValue([]);

    await transactionController.getTransactions(req, res, next);

    expect(transactionService.fetchTransactions).toHaveBeenCalledWith(
      {
        account_id: mockAccountId1,
        ...req.validated.query,
      },
      buildAuthInput()
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call fetchTransactions and return 200 with serialized transactions", async () => {
    const req: any = buildReq({
      params: { accountId: mockAccountId1 },
      query: buildTransactionQueryInput({
        type: TransactionType.DEBIT,
        limit: 5,
        offset: 10,
      }),
      user: buildAuthInput(),
    });

    jest
      .spyOn(transactionService, "fetchTransactions")
      .mockResolvedValue([mockTransactionOutput1, mockTransactionOutput2]);

    await transactionController.getTransactions(req, res, next);

    expect(transactionService.fetchTransactions).toHaveBeenCalledWith(
      {
        account_id: mockAccountId1,
        ...req.validated.query,
      },
      buildAuthInput()
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith([
      mockTransactionOutput1,
      mockTransactionOutput2,
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const req: any = buildReq({
      params: { accountId: mockAccountId1 },
      query: buildTransactionQueryInput(),
      user: buildAuthInput(),
    });

    jest
      .spyOn(transactionService, "fetchTransactions")
      .mockRejectedValue(serviceError);

    await transactionController.getTransactions(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(serviceError);
  });
});

describe("getTransactionById controller", () => {
  it("should call fetchTransactionById and return 200 with serialized transaction", async () => {
    const req: any = buildReq({
      params: { accountId: mockAccountId1, transactionId: mockTransactionId1 },
      user: buildAuthInput(),
    });

    jest
      .spyOn(transactionService, "fetchTransactionById")
      .mockResolvedValue(mockTransactionOutput1);

    await transactionController.getTransactionById(req, res, next);

    expect(transactionService.fetchTransactionById).toHaveBeenCalledWith(
      mockTransactionId1,
      buildAuthInput()
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(mockTransactionOutput1);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const req: any = buildReq({
      params: { accountId: mockAccountId1, transactionId: mockMissingTransactionId },
      user: buildAuthInput(),
    });

    jest
      .spyOn(transactionService, "fetchTransactionById")
      .mockRejectedValue(serviceError);

    await transactionController.getTransactionById(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(serviceError);
  });
});