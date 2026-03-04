import jwt, { SignOptions } from "jsonwebtoken";
import { AccountType, AccountStatus, UserRole } from "../../../src/generated/enums";
import { Decimal } from "@prisma/client/runtime/client";
import { Account } from "../../../src/generated/client";


const CUSTOMER_ID = "550e8400-e29b-41d4-a716-446655440000";
const ACCOUNT_ID = "550e8400-e29b-41d4-a716-446655440001";
const USER_ID = "550e8400-e29b-41d4-a716-446655440099";

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
    customer_id: CUSTOMER_ID,
    type: AccountType.SAVINGS,
    currency: "USD",
    ...overrides,
  };
}

export function buildAccountCreateOutput(
  overrides: Partial<AccountCreateOutput> = {}
): AccountCreateOutput {
  return {
    customer_id: CUSTOMER_ID,
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
      sub: USER_ID,
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
    id: ACCOUNT_ID,
    customer_id: CUSTOMER_ID,
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