import { AccountType, AccountStatus } from "../generated/enums";

export type AccountCreateInput = {
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
  id: string;
  customer_id: string;
  type: AccountType;
  currency: string;
  nickname?: string;
  status: AccountStatus;
  balance: string;
  created_at?: Date;
  updated_at?: Date;
};

export type AccountSummaryOutput = {
  account_id: string;
  type: AccountType;
  currency: string;
  status: AccountStatus;
  balance: string;
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