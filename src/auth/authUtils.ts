import { Customer, User } from "../generated/client";
import { MeOutput } from "./user";

export function serializeMe(
  user: User & {
    customer: Customer
  }
): MeOutput {
  return {
    username: user.username,
    role: user.role,
    customer: {
      id: user.customer.id,
      firstName: user.customer.first_name,
      lastName: user.customer.last_name,
      email: user.customer.email,
      phone: user.customer.phone,
    },
  }
}