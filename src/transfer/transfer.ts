import { TransactionType } from "../generated/enums";

export type TransferCreateInput = {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  memo?: string;
};

export type TransferOutput = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  memo?: string;
};
