import { AccountType, AccountStatus } from "../../../src/generated/enums";
import { Decimal } from "@prisma/client/runtime/client";

export type AccountCreateInputOptionals = {
  nickname?: string;
  status?: AccountStatus;
  balance?: string;
};


export type AccountCreateInput = {
  customer_id: string;
  type: AccountType;
  currency: string;
  nickname?: string;
  status?: AccountStatus;
  balance?: string;
};

export type AccountCreateOutput = {
  customer_id: string;
  type: AccountType;
  currency: string;
  nickname: string;
  status: AccountStatus;
  balance: string;
};

export function buildAccountCreateInput(
  overrides: Partial<AccountCreateInput> = {}
): AccountCreateInput {
  return {
    customer_id: "1",
    type: AccountType.SAVINGS,
    currency: "USD",
    ...overrides,
  };
}

export function buildAccountCreateOutput(
  overrides: Partial<AccountCreateOutput> = {}
): AccountCreateOutput {
  return {
    customer_id: "1",
    type: AccountType.SAVINGS,
    currency: "USD",
    nickname: "alice",
    status: AccountStatus.ACTIVE,
    balance: new Decimal(0).toString(),
    ...overrides,
  };
}