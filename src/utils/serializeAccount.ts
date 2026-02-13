
import type { Account } from '../generated/client';

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