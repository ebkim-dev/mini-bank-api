import { serializeTransfer } from "../../../src/transfer/transferUtils";
import { buildTransferRecord } from "../../transferMock";

describe("serializeTransfer helper function", () => {
  it("should correctly serialize transfer record", () => {
    const transfer = buildTransferRecord({
      memo: "foo",
    });

    const result = serializeTransfer(transfer);
    expect(result).toEqual({
      id: transfer.id,
      fromAccountId: transfer.from_account_id,
      toAccountId: transfer.to_account_id,
      amount: transfer.amount.toString(),
      memo: transfer.memo,
    });
  });

  it("serializes transfer without memo", () => {
    const transfer = buildTransferRecord();

    const result = serializeTransfer(transfer);
    expect(result).toEqual({
      id: transfer.id,
      fromAccountId: transfer.from_account_id,
      toAccountId: transfer.to_account_id,
      amount: transfer.amount.toString(),
      memo: "",
    });
  });
});