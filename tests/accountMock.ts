import { AccountType, AccountStatus } from "../src/generated/enums";
import { Decimal } from "@prisma/client/runtime/client";
import { Account } from "../src/generated/client";
import { mockAccountId1, mockCustomerId1 } from "./commonMock";
import { AccountCreateInput, AccountOutput, AccountUpdateInput } from "../src/account/account";

export interface AccountCreateRequestBody {
  type: AccountType;
  currency: string;
  nickname?: string | null;
  status?: AccountStatus;
  balance?: string;
}

export function buildAccountCreateRequestBody(
  overrides: Partial<AccountCreateRequestBody> = {}
) {
  return {
    type: AccountType.SAVINGS,
    currency: "USD",
    ...overrides,
  };
}

export function buildAccountCreateInput(
  overrides: Partial<AccountCreateInput> = {}
): AccountCreateInput {
  return {
    type: AccountType.SAVINGS,
    currency: "USD",
    ...overrides,
  };
}

export function buildAccountCreateOutput(
  overrides: Partial<AccountOutput> = {}
): AccountOutput {
  return {
    id: mockAccountId1,
    customer_id: mockCustomerId1,
    type: AccountType.SAVINGS,
    currency: "USD",
    nickname: "",
    status: AccountStatus.ACTIVE,
    balance: new Decimal(0).toString(),
    ...overrides,
  };
}

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
    customer_id: mockCustomerId1,
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
    customer_id: mockCustomerId1,
    type: AccountType.SAVINGS,
    currency: "USD",
    nickname: "",
    status: AccountStatus.ACTIVE,
    balance: (new Decimal(0)).toString(),
    ...overrides,
  };
}