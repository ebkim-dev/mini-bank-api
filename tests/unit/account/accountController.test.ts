
import * as accountService from "../../../src/account/accountService";
import * as accountController from "../../../src/account/accountController";
import { Decimal } from "@prisma/client/runtime/client";
import { AccountType, AccountStatus, UserRole } from "../../../src/generated/enums";
import { AccountCreateInput, AccountOutput } from "../../../src/account/account";
import { AuthInput, JwtPayload } from "../../../src/auth/user";

const now = Date.now();
const mockedJwtPayload: JwtPayload = {
  sub: "123",
  role: UserRole.ADMIN
};
const mockedAuthInput: AuthInput = {
  actorId: "123",
  role: UserRole.ADMIN
}

const mockAccountCreateInput: AccountCreateInput = {
  customer_id: 1n,
  type: AccountType.SAVINGS,
  currency: "USD",
  nickname: "alice",
  status: AccountStatus.ACTIVE,
  balance: 0,
}

const mockAccountOutput1: AccountOutput = {
  customer_id: 1n.toString(),
  type: AccountType.SAVINGS,
  currency: "USD",
  nickname: "alice",
  status: AccountStatus.ACTIVE,
  balance: (new Decimal(0)).toString(),
}
const mockAccountOutput2: AccountOutput = {
  customer_id: 1n.toString(),
  type: AccountType.CHECKING,
  currency: "USD",
  nickname: "bob",
  status: AccountStatus.ACTIVE,
  balance: (new Decimal(0)).toString(),
}

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


describe("createAccount controller", () => {
  it("should call insertAccount and return 201 with serialized account", async () => {
    const req: any = { validated: { 
      body: { ...mockAccountCreateInput },
      user: mockedJwtPayload
    }};
    
    jest.spyOn(accountService, "insertAccount").mockResolvedValue(mockAccountOutput1);
    await accountController.createAccount(req, res, next);

    expect(accountService.insertAccount).toHaveBeenCalledWith(
      req.validated.body,
      mockedAuthInput
    );
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(mockAccountOutput1);
    expect(next).not.toHaveBeenCalled();
  });
  
  it("should call next when service throws", async () => {
    const req: any = { validated: { 
      body: { ...mockAccountCreateInput },
      user: mockedJwtPayload
    }};
    
    jest.spyOn(accountService, "insertAccount").mockRejectedValue(serviceError);
    await accountController.createAccount(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("getAccountsByCustomerId controller", () => {
  it("should call fetchAccountsByCustomerId and return 200 with empty array if no accounts are found", async () => {
    const req: any = { validated: { 
      query: { customer_id: 9999999n },
      user: mockedJwtPayload
    }};

    jest.spyOn(accountService, "fetchAccountsByCustomerId").mockResolvedValue([]);
    await accountController.getAccountsByCustomerId(req, res, next);

    expect(accountService.fetchAccountsByCustomerId).toHaveBeenCalledWith(
      req.validated.query.customer_id,
      mockedAuthInput
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call fetchAccountsByCustomerId and return 200 with an array of serialized accounts", async () => {
    const req: any = { validated: { 
      query: { customer_id: 1n },
      user: mockedJwtPayload
    }};

    jest.spyOn(accountService, "fetchAccountsByCustomerId")
      .mockResolvedValue([mockAccountOutput1, mockAccountOutput2]);

    await accountController.getAccountsByCustomerId(req, res, next);

    expect(accountService.fetchAccountsByCustomerId).toHaveBeenCalledWith(
      req.validated.query.customer_id,
      mockedAuthInput
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith([mockAccountOutput1, mockAccountOutput2]);
    expect(next).not.toHaveBeenCalled();
  });
  
  it("should call next when service throws", async () => {
    const req: any = { validated: { 
      query: { customer_id: 9999999n },
      user: mockedJwtPayload
    }};

    jest.spyOn(accountService, "fetchAccountsByCustomerId")
      .mockRejectedValue(serviceError);

    await accountController.getAccountsByCustomerId(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("getAccount controller", () => {
  it("should call fetchAccountById and return 200 with serialized account", async () => {
    const req: any = { validated: { 
      params: { id: 1n },
      user: mockedJwtPayload
    }};

    jest.spyOn(accountService, "fetchAccountById").mockResolvedValue(mockAccountOutput1);
    await accountController.getAccount(req, res, next);

    expect(accountService.fetchAccountById).toHaveBeenCalledWith(
      req.validated.params.id,
      mockedAuthInput
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(mockAccountOutput1);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const req: any = { validated: { 
      params: { id: 9999999n },
      user: mockedJwtPayload
     } };

    jest.spyOn(accountService, "fetchAccountById").mockRejectedValue(serviceError);
    await accountController.getAccount(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("updateAccount controller", () => {
  it("should call updateAccountById and return 200 with serialized account", async () => {
    const req: any = { validated: {
        params: { id: 1n },
        body: { nickname: "asdf" },
        user: mockedJwtPayload
    }};

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
      mockedAuthInput
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(updatedAccountOutput);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const req: any = { validated: { 
      body: { id: 9999999n },
      user: mockedJwtPayload
    }};

    jest.spyOn(accountService, "fetchAccountById").mockRejectedValue(serviceError);
    await accountController.getAccount(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("deleteAccount controller", () => {
  it("should call deleteAccountById and return 200 with serialized account", async () => {
    const req: any = { validated: { 
      params: { id: 1n },
      user: mockedJwtPayload
    }};
    const closedAccountOutput: AccountOutput = {
      ...mockAccountOutput1,
      status: AccountStatus.CLOSED
    };

    jest.spyOn(accountService, "deleteAccountById").mockResolvedValue(closedAccountOutput);
    await accountController.deleteAccount(req, res, next);

    expect(accountService.deleteAccountById).toHaveBeenCalledWith(
      req.validated.params.id,
      mockedAuthInput
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(closedAccountOutput);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const req: any = { validated: { 
      body: { id: 9999999n },
      user: mockedJwtPayload
    }};

    jest.spyOn(accountService, "fetchAccountById").mockRejectedValue(serviceError);
    await accountController.getAccount(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
