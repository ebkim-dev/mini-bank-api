import { AccountType, AccountStatus } from "../generated/enums";

export type AccountCreateInput = {
  customer_id: string;
  type: AccountType;
  currency: string;
  nickname?: string;
  status?: AccountStatus;
  balance?: number;
};

export type AccountUpdateInput = {
  nickname?: string;
  status?: AccountStatus;
};

export type AccountOutput = {
  customer_id: string;
  type: AccountType;
  currency: string;
  nickname?: string;
  status: AccountStatus;
  balance: string;
};

export type AccountSummaryOutput = {
  account_id: string;
  balance: string;
  currency: string;
  status: AccountStatus;
  total_credits: number;
  total_debits: number;
  recent_transactions: {
    id: string;
    type: string;
    amount: string;
    description: string;
    created_at: Date;
  }[];
};