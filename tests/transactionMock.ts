import { Decimal } from "@prisma/client/runtime/client";
import type { Transaction } from "../src/generated/client";
import { TransactionType } from "../src/generated/enums";
import type {
  TransactionCreateInput,
  TransactionOutput,
  TransactionQueryInput,
} from "../src/transaction/transaction";
import { mockAccountId1 } from "./commonMock";

export const mockTransactionId1 = "550e8400-e29b-41d4-a716-446655440030";
export const mockTransactionId2 = "550e8400-e29b-41d4-a716-446655440031";
export const mockMissingTransactionId = "550e8400-e29b-41d4-a716-44665544003f";
export const mockRelatedTransferId = "550e8400-e29b-41d4-a716-446655440040";

export const mockTransactionDate = new Date("2026-01-15T10:00:00.000Z");

export interface TransactionCreateRequestBody {
  type: TransactionType;
  amount: string;
  description?: string;
  category?: string;
}

export function buildTransactionCreateRequestBody(
  overrides: Partial<TransactionCreateRequestBody> = {}
): TransactionCreateRequestBody {
  return {
    type: TransactionType.CREDIT,
    amount: "100.00",
    description: "mock transaction description",
    category: "mock category",
    ...overrides,
  };
}

export function buildTransactionCreateInput(
  overrides: Partial<TransactionCreateInput> = {}
): TransactionCreateInput {
  return {
    ...buildTransactionCreateRequestBody(),
    ...overrides,
  };
}

export function buildTransactionCreateInputWithoutOptionalFields(
  overrides: Partial<Omit<TransactionCreateInput, "description" | "category">> = {}
): TransactionCreateInput {
  return {
    type: TransactionType.CREDIT,
    amount: "100.00",
    ...overrides,
  };
}

export function buildTransactionRecord(
  overrides: Partial<Transaction> = {}
): Transaction {
  return {
    id: mockTransactionId1,
    account_id: mockAccountId1,
    type: TransactionType.CREDIT,
    amount: new Decimal("100.00"),
    description: "mock transaction description",
    category: "mock category",
    related_transfer_id: null,
    created_at: mockTransactionDate,
    ...overrides,
  };
}

export function buildTransactionOutput(
  overrides: Partial<TransactionOutput> = {}
): TransactionOutput {
  return {
    id: mockTransactionId1,
    account_id: mockAccountId1,
    type: TransactionType.CREDIT,
    amount: "100",
    description: "mock transaction description",
    category: "mock category",
    related_transfer_id: "",
    created_at: mockTransactionDate,
    ...overrides,
  };
}

export function buildTransactionQueryInput(
  overrides: Partial<TransactionQueryInput> = {}
): TransactionQueryInput {
  return {
    limit: 20,
    offset: 0,
    ...overrides,
  };
}