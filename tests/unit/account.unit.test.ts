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

describe("createAccount domain rule", () => {
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

    const jsonMock = jest.fn();
    const statusMock = jest.fn(() => ({ json: jsonMock }));
    const res: any = { status: statusMock };
    const next = jest.fn();

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
      validated: {
        // body: {
        //   customer_id: 1n,
        //   type: "SAVINGS",
        //   currency: "USD",
        // },
      },
    };

    const jsonMock = jest.fn();
    const statusMock = jest.fn(() => ({ json: jsonMock }));
    const res: any = { status: statusMock };
    const next = jest.fn();

    await accountController.createAccount(req, res, next);

    expect(accountService.insertAccount).toHaveBeenCalledWith(req.validated.body);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(serializeAccount(mockAccount));
    expect(next).not.toHaveBeenCalled();
  });
});

// describe("getAccountsByCustomerId domain rule", () => {

// });

// describe("getAccount domain rule", () => {

// });

// describe("updateAccount domain rule", () => {

// });

// describe("deleteAccount domain rule", () => {

// });

describe("insertAccount", () => {
  it("creates account successfully", async () => {
    const result = await insertAccount({
      customer_id: "1",
      type: AccountType.SAVINGS,
      currency: "USD"
    });

    expect(result.customer_id).toBe(1n);
  });
});
