import { Account } from "../generated/client";

export function serializeAccount(
  account: Account
) {
  return {
    customer_id: account.customer_id.toString(),
    type: account.type,
    currency: account.currency,
    nickname: account.nickname ?? "",
    status: account.status,
    balance: account.balance.toString(),
  }
}