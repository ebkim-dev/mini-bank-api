
import type { Account } from '../generated/client';
import type { Request } from "express";
import { InternalServerError } from './error';

export function serializeAccount(account: Account) {
  return {
    ...account,
    id: account.id.toString(),
    customer_id: account.customer_id.toString(),
    balance: account.balance.toString()
  };
}

export function serializeAccounts(accounts: Account[]) {
    return accounts
        .filter((account): account is Account => account !== null)
        .map(account => ({
            ...account,
            id: account.id.toString(),
            customer_id: account.customer_id.toString(), 
            balance: account.balance.toString(),
        }));
}

export function getValidated<T>(req: Request, source: "body" | "query" | "params"): T {
  const validated = (req as any).validated;
  if (!validated || !validated[source]) {
    throw InternalServerError(`Validated ${source} not found on request. Did Zod middleware run?`);
  }
  return validated[source] as T;
}