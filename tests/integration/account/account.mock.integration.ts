import jwt, { SignOptions } from "jsonwebtoken";
import { AccountType, AccountStatus, UserRole } from "../../../src/generated/enums";
import { Decimal } from "@prisma/client/runtime/client";
import { Account } from "../../../src/generated/client";
import { JwtPayload } from "../../../src/auth/user";
import { mockAccountId1, mockCustomerId, mockUserId } from "../../common.mock";

export type AccountCreateInput = {
  customer_id: string;
  type: AccountType;
  currency: string;
  nickname?: string;
  status?: AccountStatus;
  balance?: string;
};

export type AccountCreateOutput = {
  id: string;
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
    customer_id: mockCustomerId,
    type: AccountType.SAVINGS,
    currency: "USD",
    ...overrides,
  };
}

export function buildAccountCreateOutput(
  overrides: Partial<AccountCreateOutput> = {}
): AccountCreateOutput {
  return {
    id: mockAccountId1,
    customer_id: mockCustomerId,
    type: AccountType.SAVINGS,
    currency: "USD",
    nickname: "",
    status: AccountStatus.ACTIVE,
    balance: new Decimal(0).toString(),
    ...overrides,
  };
}

export function buildMockAccountRecord(
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

export function buildJwtPayload(
  overrides: Partial<JwtPayload> = {}
): JwtPayload {
  return {
    sub: mockAccountId1,
    role: UserRole.ADMIN,
    ...overrides,
  };
}

export function buildToken(
  role: UserRole, 
  expiresIn: NonNullable<SignOptions["expiresIn"]>
): string {
  return jwt.sign(
    {
      sub: mockUserId,
      role: role,
    },
    process.env.JWT_SECRET as string,
    { expiresIn }
  );
}
