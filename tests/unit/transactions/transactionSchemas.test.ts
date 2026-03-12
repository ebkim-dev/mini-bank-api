import {
  createTransactionBodySchema,
  getTransactionsQuerySchema,
  transactionIdParamsSchema,
} from "../../../src/transaction/transactionSchemas";

import { TransactionType } from "../../../src/generated/enums";
import { mockAccountId1 } from "../../commonMock";
import { mockTransactionId1 } from "../../transactionMock";

describe("transactionIdParamsSchema", () => {
  test("accepts valid UUID id", () => {
    const parsed = transactionIdParamsSchema.parse({
      id: mockTransactionId1,
    });
    expect(parsed.id).toBe(mockTransactionId1);
  });

  test("rejects invalid UUID id", () => {
    expect(() =>
      transactionIdParamsSchema.parse({ id: "not-a-uuid" })
    ).toThrow();
  });

  test("rejects missing id", () => {
    expect(() => transactionIdParamsSchema.parse({})).toThrow();
  });

  test("rejects extra fields because of strict()", () => {
    expect(() =>
      transactionIdParamsSchema.parse({
        id: mockTransactionId1,
        extra: "nope",
      })
    ).toThrow();
  });
});

describe("createTransactionBodySchema", () => {
  test("accepts valid body with all fields", () => {
    const parsed = createTransactionBodySchema.parse({
      account_id: mockAccountId1,
      type: TransactionType.CREDIT,
      amount: "100.00",
      description: "Test deposit",
      category: "DEPOSIT",
    });

    expect(parsed.account_id).toBe(mockAccountId1);
    expect(parsed.type).toBe(TransactionType.CREDIT);
    expect(parsed.amount).toBe("100.00");
    expect(parsed.description).toBe("Test deposit");
    expect(parsed.category).toBe("DEPOSIT");
  });

  test("accepts valid body with only required fields", () => {
    const parsed = createTransactionBodySchema.parse({
      account_id: mockAccountId1,
      type: TransactionType.DEBIT,
      amount: "50.00",
    });

    expect(parsed.account_id).toBe(mockAccountId1);
    expect(parsed.type).toBe(TransactionType.DEBIT);
    expect(parsed.amount).toBe("50.00");
    expect(parsed.description).toBeUndefined();
    expect(parsed.category).toBeUndefined();
  });

  test("rejects invalid UUID account_id", () => {
    expect(() =>
      createTransactionBodySchema.parse({
        account_id: "not-a-uuid",
        type: TransactionType.CREDIT,
        amount: "100.00",
      })
    ).toThrow();
  });

  test("rejects invalid enum type", () => {
    expect(() =>
      createTransactionBodySchema.parse({
        account_id: mockAccountId1,
        type: "TRANSFER",
        amount: "100.00",
      })
    ).toThrow();
  });

  test("rejects negative amount", () => {
    expect(() =>
      createTransactionBodySchema.parse({
        account_id: mockAccountId1,
        type: TransactionType.CREDIT,
        amount: "-50.00",
      })
    ).toThrow("amount must be a positive number");
  });

  test("rejects zero amount", () => {
    expect(() =>
      createTransactionBodySchema.parse({
        account_id: mockAccountId1,
        type: TransactionType.CREDIT,
        amount: "0",
      })
    ).toThrow("amount must be a positive number");
  });

  test("rejects non-numeric amount", () => {
    expect(() =>
      createTransactionBodySchema.parse({
        account_id: mockAccountId1,
        type: TransactionType.CREDIT,
        amount: "abc",
      })
    ).toThrow("amount must be a positive number");
  });

  test("rejects missing required fields", () => {
    expect(() =>
      createTransactionBodySchema.parse({
        type: TransactionType.CREDIT,
        amount: "100.00",
      })
    ).toThrow();

    expect(() =>
      createTransactionBodySchema.parse({
        account_id: mockAccountId1,
        amount: "100.00",
      })
    ).toThrow();

    expect(() =>
      createTransactionBodySchema.parse({
        account_id: mockAccountId1,
        type: TransactionType.CREDIT,
      })
    ).toThrow();
  });

  test("rejects description longer than 255 characters", () => {
    expect(() =>
      createTransactionBodySchema.parse({
        account_id: mockAccountId1,
        type: TransactionType.CREDIT,
        amount: "100.00",
        description: "a".repeat(256),
      })
    ).toThrow();
  });

  test("rejects category longer than 100 characters", () => {
    expect(() =>
      createTransactionBodySchema.parse({
        account_id: mockAccountId1,
        type: TransactionType.CREDIT,
        amount: "100.00",
        category: "a".repeat(101),
      })
    ).toThrow();
  });

  test("rejects extra fields because of strict()", () => {
    expect(() =>
      createTransactionBodySchema.parse({
        account_id: mockAccountId1,
        type: TransactionType.CREDIT,
        amount: "100.00",
        extra: "nope",
      })
    ).toThrow();
  });
});

describe("getTransactionsQuerySchema", () => {
  test("accepts empty query and applies defaults", () => {
    const parsed = getTransactionsQuerySchema.parse({});

    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
    expect(parsed.type).toBeUndefined();
    expect(parsed.from).toBeUndefined();
    expect(parsed.to).toBeUndefined();
  });

  test("accepts all optional filters", () => {
    const parsed = getTransactionsQuerySchema.parse({
      limit: "10",
      offset: "5",
      type: TransactionType.CREDIT,
      from: "2026-03-01T00:00:00Z",
      to: "2026-03-31T23:59:59Z",
    });

    expect(parsed.limit).toBe(10);
    expect(parsed.offset).toBe(5);
    expect(parsed.type).toBe(TransactionType.CREDIT);
    expect(parsed.from).toBe("2026-03-01T00:00:00Z");
    expect(parsed.to).toBe("2026-03-31T23:59:59Z");
  });

  test("transforms limit and offset from string to number", () => {
    const parsed = getTransactionsQuerySchema.parse({
      limit: "50",
      offset: "25",
    });

    expect(typeof parsed.limit).toBe("number");
    expect(typeof parsed.offset).toBe("number");
    expect(parsed.limit).toBe(50);
    expect(parsed.offset).toBe(25);
  });

  test("rejects limit below 1", () => {
    expect(() =>
      getTransactionsQuerySchema.parse({ limit: "0" })
    ).toThrow("limit must be between 1 and 100");
  });

  test("rejects limit above 100", () => {
    expect(() =>
      getTransactionsQuerySchema.parse({ limit: "101" })
    ).toThrow("limit must be between 1 and 100");
  });

  test("rejects negative offset", () => {
    expect(() =>
      getTransactionsQuerySchema.parse({ offset: "-1" })
    ).toThrow("offset must be 0 or greater");
  });

  test("rejects invalid transaction type", () => {
    expect(() =>
      getTransactionsQuerySchema.parse({ type: "TRANSFER" })
    ).toThrow();
  });

  test("rejects invalid from date format", () => {
    expect(() =>
      getTransactionsQuerySchema.parse({ from: "not-a-date" })
    ).toThrow("from must be a valid ISO date");
  });

  test("rejects invalid to date format", () => {
    expect(() =>
      getTransactionsQuerySchema.parse({ to: "yesterday" })
    ).toThrow("to must be a valid ISO date");
  });

  test("rejects extra fields because of strict()", () => {
    expect(() =>
      getTransactionsQuerySchema.parse({ extra: "nope" })
    ).toThrow();
  });
});