import { serializeMe } from "../../../src/auth/authUtils";
import { buildCustomerRecord, buildUserRecord } from "../../authMock";


describe("serializeMe helper", () => {
  it("should correctly serialize User-Customer record", () => {
    const user = buildUserRecord();
    const customer = buildCustomerRecord();
    const output = serializeMe({
      ...user,
      customer: {
        ...customer
      }
    });

    expect(output).toEqual({
      username: user.username,
      role: user.role,
      customer: {
        id: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  });
});