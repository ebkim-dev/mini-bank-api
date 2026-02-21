import { 
  AccountType,
  AccountStatus,
 } from "../../src/types/account";

import * as accountService from "../../src/service/accountService";
import * as accountController from "../../src/controller/accountController";

import {
  serializeAccount,
  serializeAccounts,
} from "../../src/utils/helpers";
import { Decimal } from "@prisma/client/runtime/client";

let next: jest.Mock;
let jsonMock: jest.Mock;
let statusMock: jest.Mock;
let res: any;

const mockAccount1 = {
  id: 1n,
  customer_id: 1n,
  type: AccountType.SAVINGS,
  currency: "USD",
  nickname: "alice",
  status: AccountStatus.ACTIVE,
  balance: new Decimal(0),
};

const mockAccount2 = {
  id: 2n,
  customer_id: 1n,
  type: AccountType.CHECKING,
  currency: "USD",
  nickname: "bob",
  status: AccountStatus.ACTIVE,
  balance: new Decimal(0),
};

beforeEach(() => {
  next = jest.fn();
  jsonMock = jest.fn();
  statusMock = jest.fn(() => ({ json: jsonMock }));
  res = { status: statusMock };
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});


describe("createAccount controller", () => {
  it("should call insertAccount and return 201 with serialized account", async () => {
    const currentDate = new Date();
    const mockAccount = {
      ...mockAccount1,
      created_at: currentDate,
      updated_at: currentDate,
    }

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
  
  it("should call next when service throws", async () => {
    const error = new Error("Service encountered an error");
    jest.spyOn(accountService, "insertAccount").mockRejectedValue(error);

    const req: any = {
      validated: { body: { mock: "mockInput" } },
    };

    await accountController.createAccount(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("getAccountsByCustomerId controller", () => {
  it("should call fetchAccountsByCustomerId and return 200 with empty array if no accounts are found", async () => {
    jest.spyOn(accountService, "fetchAccountsByCustomerId")
      .mockResolvedValue([]);

    const req: any = {
      validated: {
        query: {
          customerId: 9999999n
        }
      },
    };

    await accountController.getAccountsByCustomerId(req, res, next);

    expect(accountService.fetchAccountsByCustomerId).toHaveBeenCalledWith(req.validated.query.customerId);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(serializeAccounts([]));
    expect(next).not.toHaveBeenCalled();
  });

  it("should call fetchAccountsByCustomerId and return 200 with an array of serialized accounts", async () => {
    const currentDate = new Date();
    const datedMockAccount1 = {
      ...mockAccount1,
      created_at: currentDate,
      updated_at: currentDate,
    }
    const datedMockAccount2 = {
      ...mockAccount2,
      created_at: currentDate,
      updated_at: currentDate,
    }

    jest.spyOn(accountService, "fetchAccountsByCustomerId")
      .mockResolvedValue([datedMockAccount1, datedMockAccount2]);

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
    expect(jsonMock).toHaveBeenCalledWith(serializeAccounts([datedMockAccount1, datedMockAccount2]));
    expect(next).not.toHaveBeenCalled();
  });
  
  it("should call next when service throws", async () => {
    const error = new Error("Service encountered an error");
    jest.spyOn(accountService, "fetchAccountsByCustomerId")
      .mockRejectedValue(error);

    const req: any = {
      validated: { body: { customerId: 9999999n } },
    };

    await accountController.getAccountsByCustomerId(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("getAccount controller", () => {
  it("should call fetchAccountById and return 200 with serialized account", async () => {
    const currentDate = new Date();
    
    const mockAccount = {
      ...mockAccount1,
      created_at: currentDate,
      updated_at: currentDate,
    }

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

  it("should call next when service throws", async () => {
    const error = new Error("Service encountered an error");
    jest.spyOn(accountService, "fetchAccountById")
      .mockRejectedValue(error);

    const req: any = {
      validated: { body: { id: 9999999n } },
    };

    await accountController.getAccount(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("updateAccount controller", () => {
  it("should call updateAccountById and return 200 with serialized account", async () => {
    const currentDate = new Date();
    
    const mockAccount = {
      ...mockAccount1,
      created_at: currentDate,
      updated_at: currentDate,
    }

    jest.spyOn(accountService, "updateAccountById").mockResolvedValue(mockAccount);

    const req: any = {
      validated: {
        params: {
          id: 1n,
        },
        body: {
          nickname: "alice",
          status: AccountStatus.ACTIVE
        },
      },
    };

    await accountController.updateAccount(req, res, next);

    expect(accountService.updateAccountById).toHaveBeenCalledWith(req.validated.params.id, req.validated.body);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(serializeAccount(mockAccount));
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const error = new Error("Service encountered an error");
    jest.spyOn(accountService, "fetchAccountById")
      .mockRejectedValue(error);

    const req: any = {
      validated: { body: { id: 9999999n } },
    };

    await accountController.getAccount(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("deleteAccount controller", () => {
  it("should call deleteAccountById and return 200 with serialized account", async () => {
    const currentDate = new Date();
    
    const mockAccount = {
      ...mockAccount1,
      created_at: currentDate,
      updated_at: currentDate,
    }

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

  it("should call next when service throws", async () => {
    const error = new Error("Service encountered an error");
    jest.spyOn(accountService, "fetchAccountById")
      .mockRejectedValue(error);

    const req: any = {
      validated: { body: { id: 9999999n } },
    };

    await accountController.getAccount(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
