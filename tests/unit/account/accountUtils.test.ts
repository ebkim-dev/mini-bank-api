import { serializeAccount, serializeAccountSummary } from "../../../src/account/accountUtils";
import { TransactionType } from "../../../src/generated/enums";
import { buildAccountRecord } from "../../accountMock";
import { buildTransactionRecord } from "../../transactionMock";


describe("serializeAccount helper", () => {
  it("should correctly serialize account record", () => {
    const account = buildAccountRecord({
      nickname: "foo",
    });

    const result = serializeAccount(account);
    expect(result).toEqual({
      id: account.id,
      customer_id: account.customer_id,
      type: account.type,
      currency: account.currency,
      nickname: account.nickname,
      status: account.status,
      balance: account.balance.toString(),
    });
  });

  it("serializes account without nickname", () => {
    const account = buildAccountRecord();

    const result = serializeAccount(account);
    expect(result).toEqual({
      id: account.id,
      customer_id: account.customer_id,
      type: account.type,
      currency: account.currency,
      nickname: "",
      status: account.status,
      balance: account.balance.toString(),
    });
  });
});

describe("serializeAccountSummary helper", () => {
  it("should correctly serialize account summary record", () => {
    const account = buildAccountRecord();
    const transaction1 = buildTransactionRecord();
    const transaction2 = buildTransactionRecord({
      type: TransactionType.CREDIT
    });
    const result = serializeAccountSummary(
      account, 1, 1, [transaction1, transaction2]
    );

    expect(result).toEqual({
      account_id: account.id,
      type: account.type,
      currency: account.currency,
      status: account.status,
      balance: account.balance.toString(),
      total_credits: 1,
      total_debits: 1,
      recent_transactions: [
        {
          id: transaction1.id,
          type: transaction1.type,
          amount: transaction1.amount.toString(),
          description: transaction1.description ?? "",
          created_at: transaction1.created_at,
        },
        {
          id: transaction2.id,
          type: transaction2.type,
          amount: transaction2.amount.toString(),
          description: transaction2.description ?? "",
          created_at: transaction2.created_at,
        }
      ],
    });
  });

  it("should correctly serialize empty account summary record", () => {
    const account = buildAccountRecord();
    const result = serializeAccountSummary(
      account, 0, 0, []
    );

    expect(result).toEqual({
      account_id: account.id,
      type: account.type,
      currency: account.currency,
      status: account.status,
      balance: account.balance.toString(),
      total_credits: 0,
      total_debits: 0,
      recent_transactions: [],
    });
  });
});