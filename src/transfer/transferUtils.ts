import { Transfer } from "../generated/client";
import { TransferOutput } from "./transfer";

export function serializeTransfer(
  transfer: Transfer
): TransferOutput {
  return {
    id: transfer.id,
    fromAccountId: transfer.from_account_id,
    toAccountId: transfer.to_account_id,
    amount: transfer.amount.toString(),
    memo: transfer.memo ?? "",
  }
}
