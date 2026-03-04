import {
  accountIdParamsSchema,
  getAccountsQuerySchema,
  createAccountBodySchema,
  updateAccountBodySchema,
} from "../../../src/account/accountSchemas";

import { AccountStatus, AccountType } from "../../../src/generated/enums";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
describe("accountSchemas.ts", () => {

  describe("accountIdParamsSchema", () => {
    test("accepts UUID id", () => {
      const parsed = accountIdParamsSchema.parse({ id: UUID });
      expect(parsed.id).toBe(UUID);
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
      const parsed = getAccountsQuerySchema.parse({ customer_id: UUID });
      expect(parsed.customer_id).toBe(UUID);
    });

    test("rejects invalid UUID customerId", () => {
      expect(() => getAccountsQuerySchema.parse({ customer_id: "999" })).toThrow();
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
        customer_id: UUID,
        type: AccountType.CHECKING,
        currency: "usd",
      });

      expect(parsed.customer_id).toBe(UUID);
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
          customer_id: BigInt(1),
          type: AccountType.CHECKING,
          currency: "US", // too short
        })
      ).toThrow("currency must be exactly 3 characters");
    });

    test("nickname can be omitted, provided, or null", () => {
      const p1 = createAccountBodySchema.parse({
        customer_id: UUID,
        type: AccountType.CHECKING,
        currency: "usd",
      });
      expect(p1.nickname).toBeUndefined();

      const p2 = createAccountBodySchema.parse({
        customer_id: UUID,
        type: AccountType.CHECKING,
        currency: "usd",
        nickname: "My Acc",
      });
      expect(p2.nickname).toBe("My Acc");

      const p3 = createAccountBodySchema.parse({
        customer_id: UUID,
        type: AccountType.CHECKING,
        currency: "usd",
        nickname: null,
      });
      expect(p3.nickname).toBeNull();
    });

    test("rejects extra fields because of strict()", () => {
      expect(() =>
        createAccountBodySchema.parse({
          customer_id: UUID,
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