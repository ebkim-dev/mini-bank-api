
import type { Account } from '../generated/client';

export function serializeAccount(account: Account) {
  return {
    ...account,
    customer_id: account.customer_id.toString(),
    balance: account.balance.toString()
  };
}

export function serializeAccounts(accounts: Account[]) {
    return accounts
        .filter((account): account is Account => account !== null)
        .map(account => ({
            ...account,
            customer_id: account.customer_id.toString(), 
            balance: account.balance.toString()
            // created_at: account.created_at?.toISOString(),
            // updated_at: account.updated_at?.toISOString(),
        }));
}