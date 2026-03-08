import { Account } from "../generated/client";
import { AccountOutput } from "./account";

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