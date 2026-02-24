

import { AccountType, AccountStatus } from "../generated/enums";

export type AccountCreateInput = {
  customer_id: bigint;
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