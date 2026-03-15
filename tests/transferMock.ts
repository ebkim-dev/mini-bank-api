import { AccountType, AccountStatus } from "../src/generated/enums";
import { Decimal } from "@prisma/client/runtime/client";
import { Account } from "../src/generated/client";
import { mockAccountId1, mockAccountId2, mockAmount, mockCustomerId, mockTransferId1 } from "./commonMock";
import { AccountCreateInput, AccountOutput, AccountUpdateInput } from "../src/account/account";
import { TransferCreateInput, TransferOutput } from "../src/transfer/transfer";

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

export function buildTransferCreateOutput(
  overrides: Partial<TransferOutput> = {}
): TransferOutput {
  return {
    id: mockTransferId1,
    fromAccountId: mockAccountId1,
    toAccountId: mockAccountId2,
    amount: mockAmount.toString(),
    ...overrides,
  };
}

// continue from here...

export function buildAccountUpdateInput(
  overrides: Partial<AccountUpdateInput> = {}
): AccountUpdateInput {
  return {
    nickname: "mockUpdateNickname",
    status: AccountStatus.ACTIVE,
    ...overrides,
  };
}

export function buildAccountRecord(
  overrides: Partial<Account> = {}
): Account { 
  const mockDate = new Date();
  const mockAccountRecord: Account = {
    id: mockAccountId1,
    customer_id: mockCustomerId,
    type: AccountType.SAVINGS,
    currency: "USD",
    nickname: null,
    status: AccountStatus.ACTIVE,
    balance: new Decimal(0),
    created_at: mockDate,
    updated_at: mockDate,
    ...overrides
  };
  return mockAccountRecord;
}

export function buildAccountOutput(
  overrides: Partial<AccountOutput> = {}
): AccountOutput {
  return {
    id: mockAccountId1,
    customer_id: mockCustomerId,
    type: AccountType.SAVINGS,
    currency: "USD",
    nickname: "",
    status: AccountStatus.ACTIVE,
    balance: (new Decimal(0)).toString(),
    ...overrides,
  };
}