
export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

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