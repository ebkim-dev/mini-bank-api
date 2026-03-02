import jwt, { SignOptions } from "jsonwebtoken";
import { AccountType, AccountStatus, UserRole } from "../../../src/generated/enums";
import { Decimal } from "@prisma/client/runtime/client";
import { Account } from "../../../src/generated/client";

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
  nickname: string | null;
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
    nickname: "",
    status: AccountStatus.ACTIVE,
    balance: new Decimal(0).toString(),
    ...overrides,
  };
}

export function buildToken(
  role: UserRole, 
  expiresIn: NonNullable<SignOptions["expiresIn"]>
): string {
  return jwt.sign(
    {
      sub: "123",
      role: role,
    },
    process.env.JWT_SECRET as string,
    { expiresIn }
  );
}

export function buildMockAccountRecord(
  overrides: Partial<Account> = {}
): Account { 
  const mockDate = new Date();
  const mockAccountRecord: Account = {
    id: 1n,
    customer_id: 1n,
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