import { insertAccount } from "../../src/service/accountService";
import { AccountType } from "../../src/types/account";

describe("insertAccount", () => {
  it("creates account successfully", async () => {
    const result = await insertAccount({
      customer_id: "1",
      type: AccountType.SAVINGS,
      currency: "USD"
    });

    expect(result.customer_id).toBe(1n);
  });
});
