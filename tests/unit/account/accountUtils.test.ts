import { serializeAccount } from "../../../src/account/accountUtils";
import { buildAccountRecord } from "../../accountMock";


describe("serializeAccount helper function", () => {
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