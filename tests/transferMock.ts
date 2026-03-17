import { Transfer } from "../src/generated/client";
import { mockAccountId1, mockAccountId2, mockAmount, mockTransferId1 } from "./commonMock";
import { TransferCreateInput, TransferOutput } from "../src/transfer/transfer";

export interface TransferCreateRequestBody {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  memo?: string;
}

export function buildTransferCreateRequestBody(
  overrides: Partial<TransferCreateRequestBody> = {}
) {
  return {
    fromAccountId: mockAccountId1,
    toAccountId: mockAccountId2,
    amount: mockAmount,
    ...overrides,
  };
}

export function buildTransferCreateInput(
  overrides: Partial<TransferCreateInput> = {}
): TransferCreateInput {
  return {
    fromAccountId: mockAccountId1,
    toAccountId: mockAccountId2,
    amount: mockAmount,
    ...overrides,
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