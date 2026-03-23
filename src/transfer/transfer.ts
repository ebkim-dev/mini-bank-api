import { Decimal } from "@prisma/client/runtime/client";

export type TransferCreateInput = {
  toAccountId: string;
  amount: Decimal;
  memo?: string;
};

export type TransferOutput = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  memo?: string;
};

export type TransferQueryInput = {
  limit: number;
  offset: number;
  from?: Date;
  to?: Date;
};
