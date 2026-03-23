import { Account, Transaction } from "../generated/client";
import { AccountOutput, AccountSummaryOutput } from "./account";

export function serializeAccount(
  account: Account
): AccountOutput {
  return {
    id: account.id,
    customer_id: account.customer_id,
    type: account.type,
    currency: account.currency,
    nickname: account.nickname ?? "",
    status: account.status,
    balance: account.balance.toString(),
  }
}

export function serializeAccountSummary(
  account: Account,
  totalCredits: number,
  totalDebits: number,
  recentTransactions: Transaction[]
): AccountSummaryOutput {
  return {
    account_id: account.id,
    type: account.type,
    currency: account.currency,
    status: account.status,
    balance: account.balance.toString(),
    total_credits: totalCredits,
    total_debits: totalDebits,
    recent_transactions: recentTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount.toString(),
      description: t.description ?? "",
      created_at: t.created_at,
    })),
  }
}