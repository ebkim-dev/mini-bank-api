
import * as accountService from "../../../src/account/accountService";
import * as accountController from "../../../src/account/accountController";
import { AccountStatus } from "../../../src/generated/enums";
import { AccountOutput } from "../../../src/account/account";
import { mockAccountId1, mockCustomerId, mockMissingAccountId } from "../../commonMock";
import { buildAuthInput, buildJwtPayload } from "../../authMock";
import { buildAccountCreateInput, buildAccountOutput } from "../../accountMock";

const mockAccountOutput1 = buildAccountOutput({ nickname: "alice" });
const mockAccountOutput2 = buildAccountOutput({ nickname: "bob" });
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
  return { validated: { ...overrides } };
}

describe("createAccount controller", () => {
  const req: any = buildReq({ 
    body: buildAccountCreateInput(), 
    user: buildJwtPayload()
  });

  it("should call insertAccount and return 201 with serialized account", async () => {
    jest.spyOn(accountService, "insertAccount")
      .mockResolvedValue(mockAccountOutput1);

    await accountController.createAccount(req, res, next);

    expect(accountService.insertAccount).toHaveBeenCalledWith(
      req.validated.body,
      buildAuthInput()
    );
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(mockAccountOutput1);
    expect(next).not.toHaveBeenCalled();
  });
  
  it("should call next when service throws", async () => {
    jest.spyOn(accountService, "insertAccount").mockRejectedValue(serviceError);
    await accountController.createAccount(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("getAccountsByCustomerId controller", () => {
  const req: any = buildReq({ 
    query: { customer_id: mockCustomerId },
    user: buildJwtPayload()
  });

  it("should call fetchAccountsByCustomerId and return 200 with empty array if no accounts are found", async () => {
    jest.spyOn(accountService, "fetchAccountsByCustomerId").mockResolvedValue([]);
    await accountController.getAccountsByCustomerId(req, res, next);

    expect(accountService.fetchAccountsByCustomerId).toHaveBeenCalledWith(
      req.validated.query.customer_id,
      buildAuthInput()
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call fetchAccountsByCustomerId and return 200 with an array of serialized accounts", async () => {
    jest.spyOn(accountService, "fetchAccountsByCustomerId")
      .mockResolvedValue([mockAccountOutput1, mockAccountOutput2]);

    await accountController.getAccountsByCustomerId(req, res, next);

    expect(accountService.fetchAccountsByCustomerId).toHaveBeenCalledWith(
      req.validated.query.customer_id,
      buildAuthInput()
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith([mockAccountOutput1, mockAccountOutput2]);
    expect(next).not.toHaveBeenCalled();
  });
  
  it("should call next when service throws", async () => {
    jest.spyOn(accountService, "fetchAccountsByCustomerId")
      .mockRejectedValue(serviceError);

    await accountController.getAccountsByCustomerId(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("getAccount controller", () => {
  it("should call fetchAccountById and return 200 with serialized account", async () => {
    const req: any = buildReq({ 
      params: { id: mockAccountId1 },
      user: buildJwtPayload()
    });

    jest.spyOn(accountService, "fetchAccountById").mockResolvedValue(mockAccountOutput1);
    await accountController.getAccount(req, res, next);

    expect(accountService.fetchAccountById).toHaveBeenCalledWith(
      req.validated.params.id,
      buildAuthInput()
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(mockAccountOutput1);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const req: any = buildReq({ 
      params: { id: mockMissingAccountId },
      user: buildJwtPayload()
    });

    jest.spyOn(accountService, "fetchAccountById").mockRejectedValue(serviceError);
    await accountController.getAccount(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("updateAccount controller", () => {
  const req: any = buildReq({ 
    params: { id: mockAccountId1 },
    body: { nickname: "asdf" },
    user: buildJwtPayload()
  });

  it("should call updateAccountById and return 200 with serialized account", async () => {
    const updatedAccountOutput: AccountOutput = {
      ...mockAccountOutput1,
      nickname: "asdf"
    };

    jest.spyOn(accountService, "updateAccountById")
      .mockResolvedValue(updatedAccountOutput);

    await accountController.updateAccount(req, res, next);

    expect(accountService.updateAccountById).toHaveBeenCalledWith(
      req.validated.params.id,
      req.validated.body,
      buildAuthInput()
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(updatedAccountOutput);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    jest.spyOn(accountService, "updateAccountById").mockRejectedValue(serviceError);
    await accountController.updateAccount(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("deleteAccount controller", () => {
  it("should call deleteAccountById and return 200 with serialized account", async () => {
    const req: any = buildReq({ 
      params: { id: 1n },
      user: buildJwtPayload()
    });
    const closedAccountOutput: AccountOutput = {
      ...mockAccountOutput1,
      status: AccountStatus.CLOSED
    };

    jest.spyOn(accountService, "deleteAccountById").mockResolvedValue(closedAccountOutput);
    await accountController.deleteAccount(req, res, next);

    expect(accountService.deleteAccountById).toHaveBeenCalledWith(
      req.validated.params.id,
      buildAuthInput()
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(closedAccountOutput);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const req: any = buildReq({ 
      params: { id: mockAccountId1 },
      user: buildJwtPayload()
    });

    jest.spyOn(accountService, "deleteAccountById").mockRejectedValue(serviceError);
    await accountController.deleteAccount(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
