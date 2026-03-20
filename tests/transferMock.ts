import { Transfer } from "../src/generated/client";
import { mockAccountId1, mockAccountId2, mockAmount, mockTransferId1 } from "./commonMock";
import { TransferCreateInput, TransferOutput, TransferQueryInput } from "../src/transfer/transfer";

export interface TransferCreateRequestBody {
  toAccountId: string;
  amount: string;
  memo?: string;
}

export function buildTransferCreateRequestBody(
  overrides: Partial<TransferCreateRequestBody> = {}
) {
  return {
    toAccountId: mockAccountId2,
    amount: mockAmount.toString(),
    ...overrides,
  };
}

export function buildTransferCreateInput(
  overrides: Partial<TransferCreateInput> = {}
): TransferCreateInput {
  return {
    toAccountId: mockAccountId2,
    amount: mockAmount,
    ...overrides,
  };
}

export function buildTransferQueryInput(
  overrides: Partial<TransferQueryInput> = {}
): TransferQueryInput {
  return {
    limit: 20,
    offset: 0, 
    ...overrides,
  };
}

export function buildTransferRecord(
  overrides: Partial<Transfer> = {}
): Transfer { 
  const mockDate = new Date();
  return {
    id: mockTransferId1,
    from_account_id: mockAccountId1,
    to_account_id: mockAccountId2,
    amount: mockAmount,
    memo: null,
    created_at: mockDate,
    updated_at: mockDate,
    ...overrides
  };
}

export function buildTransferOutput(
  overrides: Partial<TransferOutput> = {}
): TransferOutput {
  return {
    id: mockTransferId1,
    fromAccountId: mockAccountId1,
    toAccountId: mockAccountId2,
    amount: mockAmount.toString(),
    memo: "",
    ...overrides,
  };
}