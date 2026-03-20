import * as transferService from "../../../src/transfer/transferService";
import * as transferController from "../../../src/transfer/transferController";
import { mockAccountId1, mockCustomerId1, mockTransferId1 } from "../../commonMock";
import { buildAuthInput } from "../../authMock";
import { buildAccountCreateInput, buildAccountOutput } from "../../accountMock";
import { buildTransferOutput } from "../../transferMock";

const mockTransferOutput1 = buildTransferOutput();
const mockTransferOutput2 = buildTransferOutput();
const serviceError = new Error("Service encountered an error");

let next: jest.Mock;
let jsonMock: jest.Mock;
let statusMock: jest.Mock;
let res: any;

beforeEach(() => {
  next = jest.fn();
  jsonMock = jest.fn();
  statusMock = jest.fn(() => ({ json: jsonMock }));
  res = { status: statusMock };
});

afterEach(() => {
  jest.resetAllMocks();
});

function buildReq(
  overrides: Partial<{ body: any; query: any; params: any; user: any }> = {}
) {
  const { user, ...rest } = overrides;
  return { user, validated: { ...rest } };
}

describe("createTransfer controller", () => {
  const req: any = buildReq({ 
    body: buildAccountCreateInput(),
    user: buildAuthInput(),
    params: {
      accountId: mockAccountId1,
    },
  });

  it("should call insertTransfer and return 201 with serialized transfer", async () => {
    jest.spyOn(transferService, "insertTransfer")
      .mockResolvedValue(mockTransferOutput1);

    await transferController.createTransfer(req, res, next);

    expect(transferService.insertTransfer).toHaveBeenCalledWith(
      req.validated.params.accountId,
      req.validated.body,
      buildAuthInput()
    );
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(mockTransferOutput1);
    expect(next).not.toHaveBeenCalled();
  });
  
  it("should call next when service throws", async () => {
    jest.spyOn(transferService, "insertTransfer").mockRejectedValue(serviceError);
    await transferController.createTransfer(req, res, next);

    expect(transferService.insertTransfer).toHaveBeenCalledWith(
      req.validated.params.accountId,
      req.validated.body,
      buildAuthInput()
    );

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("getTransfers controller", () => {
  const req: any = buildReq({
    params: { accountId: mockAccountId1 },
    query: { customer_id: mockCustomerId1 },
    user: buildAuthInput()
  });

  it("should call fetchAccountsByCustomerId and return 200 with empty array if no accounts are found", async () => {
    jest.spyOn(transferService, "fetchTransfers").mockResolvedValue([]);
    await transferController.getTransfers(req, res, next);

    expect(transferService.fetchTransfers).toHaveBeenCalledWith(
      req.validated.params.accountId,
      req.validated.query,
      buildAuthInput()
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call fetchAccountsByCustomerId and return 200 with an array of serialized accounts", async () => {
    jest.spyOn(transferService, "fetchTransfers")
      .mockResolvedValue([mockTransferOutput1, mockTransferOutput2]);

    await transferController.getTransfers(req, res, next);

    expect(transferService.fetchTransfers).toHaveBeenCalledWith(
      req.validated.params.accountId,
      req.validated.query,
      buildAuthInput()
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith([mockTransferOutput1, mockTransferOutput2]);
    expect(next).not.toHaveBeenCalled();
  });
  
  it("should call next when service throws", async () => {
    jest.spyOn(transferService, "fetchTransfers")
      .mockRejectedValue(serviceError);

    await transferController.getTransfers(req, res, next);

    expect(transferService.fetchTransfers).toHaveBeenCalledWith(
      req.validated.params.accountId,
      req.validated.query,
      buildAuthInput()
    );

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("getTransfer controller", () => {
  const req: any = buildReq({ 
    params: {
      accountId: mockAccountId1,
      transferId: mockTransferId1,
    },
    user: buildAuthInput()
  });

  it("should call fetchTransferById and return 200 with serialized account", async () => {
    jest.spyOn(transferService, "fetchTransferById").mockResolvedValue(mockTransferOutput1);
    await transferController.getTransfer(req, res, next);

    expect(transferService.fetchTransferById).toHaveBeenCalledWith(
      req.validated.params.transferId,
      buildAuthInput()
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(mockTransferOutput1);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    jest.spyOn(transferService, "fetchTransferById").mockRejectedValue(serviceError);
    await transferController.getTransfer(req, res, next);

    expect(transferService.fetchTransferById).toHaveBeenCalledWith(
      req.validated.params.transferId,
      buildAuthInput()
    );

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
