import { Decimal } from "@prisma/client/runtime/client";
import {
  accountIdParamsSchema,
  getAccountsQuerySchema,
  createAccountBodySchema,
  updateAccountBodySchema,
} from "../../../src/account/accountSchemas";

import { AccountStatus, AccountType } from "../../../src/generated/enums";
import { mockAccountId1, mockCustomerId } from "../../commonMock";

describe("accountIdParamsSchema", () => {
  test("accepts UUID id", () => {
    const parsed = accountIdParamsSchema.parse({ 
      id: mockAccountId1
    });
    expect(parsed.id).toBe(mockAccountId1);
  });

  test("rejects invalid UUID id", () => {
    expect(() => accountIdParamsSchema.parse({ id: "123" })).toThrow();
  });

  test("rejects extra fields because of strict()", () => {
    expect(() =>
      accountIdParamsSchema.parse({ id: "123", extra: "nope" })
    ).toThrow();
  });
});

describe("getAccountsQuerySchema", () => {
  test("accepts UUID customerId", () => {
    const parsed = getAccountsQuerySchema.parse({ 
      customer_id: mockCustomerId
    });
    expect(parsed.customer_id).toBe(mockCustomerId);
  });

  test("rejects invalid UUID customerId", () => {
    expect(() => 
      getAccountsQuerySchema.parse({ customer_id: "999" })
    ).toThrow();
  });

  test("rejects extra fields because of strict()", () => {
    expect(() =>
      getAccountsQuerySchema.parse({ customer_id: "1", extra: true })
    ).toThrow();
  });
});

describe("createAccountBodySchema", () => {
  test("accepts valid UUID customer_id", () => {
    const parsed = createAccountBodySchema.parse({
      customer_id: mockCustomerId,
      type: AccountType.CHECKING,
      currency: "usd",
    });

    expect(parsed.customer_id).toBe(mockCustomerId);
    expect(parsed.currency).toBe("USD");
    expect(parsed.status).toBe(AccountStatus.ACTIVE);
    expect(parsed.balance.toString()).toBe("0");
  });

  test("rejects invalid UUID customer_id", () => {
    expect(() =>
      createAccountBodySchema.parse({
        customer_id: "not-a-uuid",
        type: AccountType.CHECKING,
        currency: "usd",
      })
    ).toThrow();
  });

  test("currency must be exactly 3 characters", () => {
    expect(() =>
      createAccountBodySchema.parse({
        customer_id: mockCustomerId,
        type: AccountType.CHECKING,
        currency: "US",
      })
    ).toThrow("currency must be exactly 3 characters");
  });

  test("nickname can be omitted, provided, or null", () => {
    const parsed1 = createAccountBodySchema.parse({
      customer_id: mockCustomerId,
      type: AccountType.CHECKING,
      currency: "usd",
    });
    expect(parsed1.nickname).toBeUndefined();

    const parsed2 = createAccountBodySchema.parse({
      customer_id: mockCustomerId,
      type: AccountType.CHECKING,
      currency: "usd",
      nickname: "My Acc",
    });
    expect(parsed2.nickname).toBe("My Acc");

    const parsed3 = createAccountBodySchema.parse({
      customer_id: mockCustomerId,
      type: AccountType.CHECKING,
      currency: "usd",
      nickname: null,
    });
    expect(parsed3.nickname).toBeNull();
  });

  test("balance is correctly transformed to decimal", () => {
    const parsed = createAccountBodySchema.parse({
      customer_id: mockCustomerId,
      type: AccountType.CHECKING,
      currency: "USD",
      balance: "123"
    });
    expect(parsed.balance).toBeInstanceOf(Decimal);
    expect(parsed.balance.toNumber()).toBe(123);
  });

  test("rejects extra fields because of strict()", () => {
    expect(() =>
      createAccountBodySchema.parse({
        customer_id: mockCustomerId,
        type: AccountType.CHECKING,
        currency: "usd",
        extra: "nope",
      })
    ).toThrow();
  });
});

describe("updateAccountBodySchema", () => {
  test("rejects empty object due to refine() 'at least one field'", () => {
    expect(() => updateAccountBodySchema.parse({})).toThrow(
      "At least one field (nickname/status) must be provided"
    );
  });

  test("accepts nickname only (including null)", () => {
    const parsed1 = updateAccountBodySchema.parse({ nickname: "New Name" });
    expect(parsed1.nickname).toBe("New Name");

    const parsed2 = updateAccountBodySchema.parse({ nickname: null });
    expect(parsed2.nickname).toBeNull();
  });

  test("accepts status only", () => {
    const parsed = updateAccountBodySchema.parse({
      status: AccountStatus.CLOSED,
    });
    expect(parsed.status).toBe(AccountStatus.CLOSED);
  });

  test("rejects extra fields because of strict()", () => {
    expect(() =>
      updateAccountBodySchema.parse({
        nickname: "X",
        extra: "nope",
      })
    ).toThrow();
  });
});