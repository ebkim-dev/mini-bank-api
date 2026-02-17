import { 
  AccountType,
  AccountStatus,
 } from "../types/account";

import * as helpers from "./helpers"

import { Decimal } from "@prisma/client/runtime/client";

const currentDate = new Date();

const unserializedAccount1 = {
  id: 1n,
  customer_id: 1n,
  type: AccountType.SAVINGS,
  currency: "USD",
  nickname: "alice",
  status: AccountStatus.ACTIVE,
  balance: new Decimal(0),
  created_at: currentDate,
  updated_at: currentDate,
};

const serializedAccount1 = {
  id: "1",
  customer_id: "1",
  type: AccountType.SAVINGS,
  currency: "USD",
  nickname: "alice",
  status: AccountStatus.ACTIVE,
  balance: "0",
  created_at: currentDate,
  updated_at: currentDate,
};

const unserializedAccount2 = {
  id: 2n,
  customer_id: 1n,
  type: AccountType.CHECKING,
  currency: "USD",
  nickname: "bob",
  status: AccountStatus.ACTIVE,
  balance: new Decimal(0),
  created_at: currentDate,
  updated_at: currentDate,
};

const serializedAccount2 = {
  id: "2",
  customer_id: "1",
  type: AccountType.CHECKING,
  currency: "USD",
  nickname: "bob",
  status: AccountStatus.ACTIVE,
  balance: "0",
  created_at: currentDate,
  updated_at: currentDate,
};


describe("serializeAccount", () => {
  it("should return serialized account object", async() => {
    const serializedAccount = 
      helpers.serializeAccount(unserializedAccount1);

    expect(serializedAccount1).toEqual(serializedAccount);
  });
});

describe("serializeAccounts", () => {
  it("should return serialized account objects given array of multiple unserialized account objects", async() => {
    const serializedMockAccounts = 
      helpers.serializeAccounts([unserializedAccount1, unserializedAccount2]);

    expect([serializedAccount1, serializedAccount2]).toEqual(serializedMockAccounts);
  });
});

describe("serializeAccounts", () => {
  it("should return serialized account objects given array of multiple unserialized account objects", async() => {
    const serializedMockAccounts = 
      helpers.serializeAccounts([unserializedAccount1, unserializedAccount2]);

    expect([serializedAccount1, serializedAccount2]).toEqual(serializedMockAccounts);
  });
});

describe("getValidated", () => {
  it("should return validated object given \"body\" source and a valid object", async() => {
    type MockObject = { foo: string };
    const req: any = { validated: { body: { foo: "bar" } } };
    const result = helpers.getValidated<MockObject>(req, "body");
    expect(result).toEqual({ foo: "bar" });
  });

  it("should return validated object given \"query\" source and a valid object", async() => {
    type MockObject = { foo: string };
    const req: any = { validated: { query: { foo: "bar" } } };
    const result = helpers.getValidated<MockObject>(req, "query");
    expect(result).toEqual({ foo: "bar" });
  });

  it("should return validated object given \"params\" source and a valid object", async() => {
    type MockObject = { foo: string };
    const req: any = { validated: { params: { foo: "bar" } } };
    const result = helpers.getValidated<MockObject>(req, "params");
    expect(result).toEqual({ foo: "bar" });
  });

  it("should throw an error given object with missing `validated` field", async() => {
    type MockObject = { foo: string };
    const req: any = {};
    expect(() => helpers.getValidated<MockObject>(req, "params")).toThrow();
  });

  it("should throw an error given object with missing source", async() => {
    type MockObject = { foo: string };
    const req: any = { validated: {} };
    expect(() => helpers.getValidated<MockObject>(req, "params")).toThrow();
  });
});
