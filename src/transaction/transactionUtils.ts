import { Transaction } from "../generated/client";

export function serializeTransaction(transaction: Transaction) {
  return {
    id: transaction.id,
    account_id: transaction.account_id,
    type: transaction.type,
    amount: transaction.amount.toString(),
    description: transaction.description ?? "",
    category: transaction.category ?? "",
    related_transfer_id: transaction.related_transfer_id ?? "",
    created_at: transaction.created_at,
  };
}