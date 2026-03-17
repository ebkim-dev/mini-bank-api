import { 
  createTransferBodySchema,
  getTransferParamsSchema,
  getTransfersQuerySchema
} from "../../../src/transfer/transferSchemas";
import { 
  mockAccountId1,
  mockAccountId2,
  mockAmount,
  mockFromDate,
  mockToDate,
  mockTransferId1
} from "../../commonMock";

describe("createTransferBodySchema", () => {
  const validTransferBody = {
    fromAccountId: mockAccountId1,
    toAccountId: mockAccountId2,
    amount: `${mockAmount}`,
  };

  it("accepts valid createTransfer body", () => {
    const parsed = createTransferBodySchema.parse({
      ...validTransferBody,
      memo: "mockMemo",
    });

    expect(parsed.fromAccountId).toBe(mockAccountId1);
    expect(parsed.toAccountId).toBe(mockAccountId2);
    expect(parsed.amount.toString()).toBe(mockAmount.toString());
    expect(parsed.memo).toBe("mockMemo");
  });

  it("rejects invalid source account ID", () => {
    expect(() => createTransferBodySchema.parse({
      ...validTransferBody,
      fromAccountId: "not-uuid",
    })).toThrow();
  });

  it("rejects invalid destination account ID", () => {
    expect(() => createTransferBodySchema.parse({
      ...validTransferBody,
      toAccountId: "not-uuid",
    })).toThrow();
  });

  it("rejects invalid amount", () => {
    expect(() => createTransferBodySchema.parse({
      ...validTransferBody,
      amount: "not-decimal",
    })).toThrow();
  });

  it("rejects overly lengthy memo", () => {
    expect(() => createTransferBodySchema.parse({
      ...validTransferBody,
      memo: "x".repeat(256),
    })).toThrow();
  });

  it("rejects extra fields because of strict()", () => {
    expect(() => createTransferBodySchema.parse({
      ...validTransferBody,
      extra: "foo",
    })).toThrow();
  });
});

describe("getTransfersQuerySchema", () => {
  it("accepts valid getTransfers query parameters", () => {
    const parsed = getTransfersQuerySchema.parse({
      limit: "20",
      offset: "0",
      from: mockFromDate,
      to: mockToDate,
    });

    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
    expect(parsed.from).toBe(mockFromDate);
    expect(parsed.to).toBe(mockToDate);
  });

  it("accepts empty body and generates default fields", () => {
    const parsed = getTransfersQuerySchema.parse({});

    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
    expect(parsed.from).toBeUndefined();
    expect(parsed.to).toBeUndefined();
  });

  it("rejects invalid limit", () => {
    expect(() => getTransfersQuerySchema.parse({
      limit: "foo",
    })).toThrow();
  });

  it("rejects invalid offset", () => {
    expect(() => getTransfersQuerySchema.parse({
      offset: "bar",
    })).toThrow();
  });

  it("rejects invalid `from` field", () => {
    expect(() => getTransfersQuerySchema.parse({
      from: "not-iso-date",
    })).toThrow();
  });

  it("rejects invalid `to` field", () => {
    expect(() => getTransfersQuerySchema.parse({
      to: "not-iso-date",
    })).toThrow();
  });

  it("rejects extra fields because of strict()", () => {
    expect(() => getTransfersQuerySchema.parse({
      extra: "foo",
    })).toThrow();
  });
});

describe("getTransferParamsSchema", () => {
  const validTransferBody = {
    accountId: mockAccountId1,
    transferId: mockTransferId1,
  };

  it("accepts valid getTransfer path parameters", () => {
    const parsed = getTransferParamsSchema.parse({
      ...validTransferBody
    });

    expect(parsed.accountId).toBe(mockAccountId1);
    expect(parsed.transferId).toBe(mockTransferId1);
  });

  it("rejects invalid accountId", () => {
    expect(() => getTransferParamsSchema.parse({
      ...validTransferBody,
      accountId: "not-uuid",
    })).toThrow();
  });

  it("rejects invalid transferId", () => {
    expect(() => getTransferParamsSchema.parse({
      ...validTransferBody,
      transferId: "not-uuid",
    })).toThrow();
  });

  it("rejects extra fields because of strict()", () => {
    expect(() => getTransferParamsSchema.parse({
      ...validTransferBody,
      extra: "foo",
    })).toThrow();
  });
});
