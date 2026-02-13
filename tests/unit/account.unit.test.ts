import { insertAccount } from "../../src/service/accountService";
import { 
  AccountType,
  AccountStatus,
 } from "../../src/types/account";

import * as accountService from "../../src/service/accountService";
import * as accountController from "../../src/controller/accountController";

import {
  serializeAccount,
  serializeAccounts,
} from "../../src/utils/serializeAccount";
import { Decimal } from "@prisma/client/runtime/client";

let res: any;
let next: jest.Mock;
let jsonMock: jest.Mock;
let statusMock: jest.Mock;

describe("createAccount domain rule", () => {

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));
    res = { status: statusMock };
    next = jest.fn();
  })

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  })

  it("should call insertAccount and return 201 with serialized account", async () => {
    const currentDate = new Date();
    
    const mockAccount = {
      id: 1n,
      customer_id: 1n,
      type: AccountType.SAVINGS,
      currency: "USD",
      nickname: "abcdefg",
      status: AccountStatus.ACTIVE,
      balance: new Decimal(0),
      created_at: currentDate,
      updated_at: currentDate,
    };

    jest.spyOn(accountService, "insertAccount").mockResolvedValue(mockAccount);

    const req: any = {
      validated: {
        body: {
          customer_id: 1n,
          type: "SAVINGS",
          currency: "USD",
        },
      },
    };

    await accountController.createAccount(req, res, next);

    expect(accountService.insertAccount).toHaveBeenCalledWith(req.validated.body);
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(serializeAccount(mockAccount));
    expect(next).not.toHaveBeenCalled();
  });
  
  it("should call insertAccount with empty body and return 400", async () => {
    const currentDate = new Date();
    
    const mockAccount = {
      id: 1n,
      customer_id: 1n,
      type: AccountType.SAVINGS,
      currency: "USD",
      nickname: "abcdefg",
      status: AccountStatus.ACTIVE,
      balance: new Decimal(0),
      created_at: currentDate,
      updated_at: currentDate,
    };

    jest.spyOn(accountService, "insertAccount").mockResolvedValue(mockAccount);

    const req: any = {
      validated: {},
    };

    await accountController.createAccount(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(accountService.insertAccount).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("getAccountsByCustomerId domain rule", () => {
  it("should call fetchAccountsByCustomerId and return 200 with serialized account", async () => {
    const currentDate = new Date();
    
    const mockAccount = {
      id: 1n,
      customer_id: 1n,
      type: AccountType.SAVINGS,
      currency: "USD",
      nickname: "abcdefg",
      status: AccountStatus.ACTIVE,
      balance: new Decimal(0),
      created_at: currentDate,
      updated_at: currentDate,
    };

    jest.spyOn(accountService, "fetchAccountsByCustomerId").mockResolvedValue([mockAccount]);

    const req: any = {
      validated: {
        query: {
          customerId: 1n
        }
      },
    };

    await accountController.getAccountsByCustomerId(req, res, next);

    expect(accountService.fetchAccountsByCustomerId).toHaveBeenCalledWith(req.validated.query.customerId);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(serializeAccounts([mockAccount]));
    expect(next).not.toHaveBeenCalled();
  });
});

describe("getAccount domain rule", () => {
  it("should call fetchAccountById and return 200 with serialized account", async () => {
    const currentDate = new Date();
    
    const mockAccount = {
      id: 1n,
      customer_id: 1n,
      type: AccountType.SAVINGS,
      currency: "USD",
      nickname: "abcdefg",
      status: AccountStatus.ACTIVE,
      balance: new Decimal(0),
      created_at: currentDate,
      updated_at: currentDate,
    };

    jest.spyOn(accountService, "fetchAccountById").mockResolvedValue(mockAccount);

    const req: any = {
      validated: {
        params: {
          id: 1n
        }
      },
    };

    await accountController.getAccount(req, res, next);

    expect(accountService.fetchAccountById).toHaveBeenCalledWith(req.validated.params.id);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(serializeAccount(mockAccount));
    expect(next).not.toHaveBeenCalled();
  });
});

describe("updateAccount domain rule", () => {
  it("should call updateAccountById and return 200 with serialized account", async () => {
    const currentDate = new Date();
    
    const mockAccount = {
      id: 1n,
      customer_id: 1n,
      type: AccountType.SAVINGS,
      currency: "USD",
      nickname: "abcdefg",
      status: AccountStatus.ACTIVE,
      balance: new Decimal(0),
      created_at: currentDate,
      updated_at: currentDate,
    };

    jest.spyOn(accountService, "updateAccountById").mockResolvedValue(mockAccount);

    const req: any = {
      validated: {
        params: {
          id: 1n,
        },
        body: {
          customer_id: 1n,
          type: "SAVINGS",
          currency: "USD",
        },
      },
    };

    await accountController.updateAccount(req, res, next);

    expect(accountService.updateAccountById).toHaveBeenCalledWith(req.validated.params.id, req.validated.body);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(serializeAccount(mockAccount));
    expect(next).not.toHaveBeenCalled();
  });
});

describe("deleteAccount domain rule", () => {
  it("should call deleteAccountById and return 200 with serialized account", async () => {
    const currentDate = new Date();
    
    const mockAccount = {
      id: 1n,
      customer_id: 1n,
      type: AccountType.SAVINGS,
      currency: "USD",
      nickname: "abcdefg",
      status: AccountStatus.ACTIVE,
      balance: new Decimal(0),
      created_at: currentDate,
      updated_at: currentDate,
    };

    jest.spyOn(accountService, "deleteAccountById").mockResolvedValue(mockAccount);

    const req: any = {
      validated: {
        params: {
          id: 1n
        }
      },
    };

    await accountController.deleteAccount(req, res, next);

    expect(accountService.deleteAccountById).toHaveBeenCalledWith(req.validated.params.id);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(serializeAccount(mockAccount));
    expect(next).not.toHaveBeenCalled();
  });
});
