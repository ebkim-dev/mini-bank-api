import { TransactionType } from "../generated/enums";

export type TransactionCreateInput = {
  type: TransactionType;
  amount: string;
  description?: string;
  category?: string;
};

export type TransactionOutput = {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: string;
  description: string;
  category: string;
  related_transfer_id: string;
  created_at: Date;
};

export type TransactionQueryInput = {
  limit: number;
  offset: number;
  type?: TransactionType;
  from?: string;
  to?: string;
};