import {
  accountIdParamsSchema,
  getAccountsQuerySchema,
  createAccountBodySchema,
  updateAccountBodySchema,
} from "../../../src/account/accountSchemas";

import { AccountStatus, AccountType } from "../../../src/generated/enums";

describe("accountSchemas.ts", () => {

  describe("accountIdParamsSchema", () => {
    test("parses numeric id string and transforms to BigInt", () => {
      const parsed = accountIdParamsSchema.parse({ id: "123" });
      expect(parsed.id).toBe(BigInt(123));
    });

    test("rejects non-numeric id", () => {
      expect(() => accountIdParamsSchema.parse({ id: "12a3" })).toThrow(
        "id must be a numeric string"
      );
    });

    test("rejects extra fields because of strict()", () => {
      expect(() =>
        accountIdParamsSchema.parse({ id: "123", extra: "nope" })
      ).toThrow();
    });
  });

  describe("getAccountsQuerySchema", () => {
    test("parses customerId numeric string and transforms to BigInt", () => {
      const parsed = getAccountsQuerySchema.parse({ customerId: "999" });
      expect(parsed.customerId).toBe(BigInt(999));
    });

    test("rejects non-numeric customerId", () => {
      expect(() =>
        getAccountsQuerySchema.parse({ customerId: "x99" })
      ).toThrow("customerId must be a numeric string");
    });

    test("rejects extra fields because of strict()", () => {
      expect(() =>
        getAccountsQuerySchema.parse({ customerId: "1", extra: true })
      ).toThrow();
    });
  });

  describe("createAccountBodySchema", () => {
    test("customer_id preprocess: accepts bigint directly", () => {
      const parsed = createAccountBodySchema.parse({
        customer_id: BigInt(10),
        type: AccountType.CHECKING,
        currency: "usd",
      });

      expect(parsed.customer_id).toBe(BigInt(10));
      expect(parsed.currency).toBe("USD"); 
      expect(parsed.status).toBe(AccountStatus.ACTIVE);
      expect(parsed.balance.toString()).toBe("0");
    });

    test("customer_id preprocess: accepts integer number and converts to BigInt", () => {
      const parsed = createAccountBodySchema.parse({
        customer_id: 22,
        type: AccountType.SAVINGS,
        currency: "cad",
        balance: "12.50",
      });

      expect(parsed.customer_id).toBe(BigInt(22));
      expect(parsed.currency).toBe("CAD");
      expect(parsed.balance.toNumber()).toBeCloseTo(12.5,10);
    });

    test("customer_id preprocess: accepts numeric string and converts to BigInt", () => {
      const parsed = createAccountBodySchema.parse({
        customer_id: "777",
        type: AccountType.CHECKING,
        currency: "inr",
      });

      expect(parsed.customer_id).toBe(BigInt(777));
      expect(parsed.currency).toBe("INR");
    });

    test("customer_id preprocess: rejects non-numeric string (preprocess returns val -> z.bigint fails)", () => {
      expect(() =>
        createAccountBodySchema.parse({
          customer_id: "77x",
          type: AccountType.CHECKING,
          currency: "usd",
        })
      ).toThrow();
    });

    test("currency must be exactly 3 characters", () => {
      expect(() =>
        createAccountBodySchema.parse({
          customer_id: BigInt(1),
          type: AccountType.CHECKING,
          currency: "US", // too short
        })
      ).toThrow("currency must be exactly 3 characters");
    });

    test("nickname can be omitted, provided, or null", () => {
      const p1 = createAccountBodySchema.parse({
        customer_id: BigInt(1),
        type: AccountType.CHECKING,
        currency: "usd",
      });
      expect(p1.nickname).toBeUndefined();

      const p2 = createAccountBodySchema.parse({
        customer_id: BigInt(1),
        type: AccountType.CHECKING,
        currency: "usd",
        nickname: "My Acc",
      });
      expect(p2.nickname).toBe("My Acc");

      const p3 = createAccountBodySchema.parse({
        customer_id: BigInt(1),
        type: AccountType.CHECKING,
        currency: "usd",
        nickname: null,
      });
      expect(p3.nickname).toBeNull();
    });

    test("rejects extra fields because of strict()", () => {
      expect(() =>
        createAccountBodySchema.parse({
          customer_id: BigInt(1),
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
});