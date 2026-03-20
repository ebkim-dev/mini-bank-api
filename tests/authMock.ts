import { Customer, User, UserRole } from "../src/generated/client";
import { 
  AuthInput,
  LoginInput,
  LoginOutput,
  MeOutput,
  RegisterInput,
  RegisterOutput
} from "../src/auth/user";
import {
  mockCustomerId1,
  mockEmail,
  mockFirstName,
  mockHashedPassword,
  mockLastName,
  mockPassword,
  mockPhone,
  mockSessionId,
  mockUserId,
  mockUsername
} from "./commonMock";

export const mockEncryptedRedisPayload = "encrypted-session";

export function buildRegisterInput(
  overrides: Partial<RegisterInput> = {}
): RegisterInput {
  return {
    username: mockUsername,
    password: mockPassword,
    firstName: mockFirstName,
    lastName: mockLastName,
    email: mockEmail,
    ...overrides,
  };
}

export function buildRegisterOutput(
  overrides: Partial<RegisterOutput> = {}
): RegisterOutput {
  return { 
    id: mockUserId,
    ...overrides,
  };
}

export function buildLoginInput(
  overrides: Partial<LoginInput> = {}
): LoginInput {
  return {
    username: mockUsername,
    password: mockPassword,
    ...overrides,
  };
}

export function buildLoginOutput(
  overrides: Partial<LoginOutput> = {}
): LoginOutput {
  return {
    sessionId: mockSessionId,
    ...overrides,
  };
}

export function buildUserRecord(
  overrides: Partial<User> = {}
): User {
  const mockDate = new Date();
  return {
    id: mockUserId,
    customer_id: mockCustomerId1,
    username: mockUsername,
    password_hash: mockHashedPassword,
    role: UserRole.STANDARD,
    created_at: mockDate,
    updated_at: mockDate,
    ...overrides,
  };
}

export function buildAuthInput(
  overrides: Partial<AuthInput> = {}
): AuthInput {
  return {
    actorId: mockUserId,
    role: UserRole.STANDARD,
    customerId: mockCustomerId1,
    ...overrides,
  };
}

export function buildCustomerRecord(
  overrides: Partial<Customer> = {}
): Customer {
  const mockDate = new Date();
  return {
    id: mockCustomerId1,
    first_name: mockFirstName,
    last_name: mockLastName,
    email: mockEmail,
    phone: mockPhone,
    created_at: mockDate,
    updated_at: mockDate,
    ...overrides,
  };
}


export function buildMeOutput(
  overrides: Partial<MeOutput> = {}
): MeOutput {
  return {
    username: mockUsername,
    role: UserRole.STANDARD,
    customer: {
      id: mockCustomerId,
      firstName: mockFirstName,
      lastName: mockLastName,
      email: mockEmail,
      phone: mockPhone,
    },
    ...overrides,
  };
}
 
export function buildUserWithCustomer() {
  const mockDate = new Date();
  return {
    id: mockUserId,
    customer_id: mockCustomerId,
    username: mockUsername,
    password_hash: mockHashedPassword,
    role: UserRole.STANDARD,
    created_at: mockDate,
    updated_at: mockDate,
    customer: {
      id: mockCustomerId,
      first_name: mockFirstName,
      last_name: mockLastName,
      email: mockEmail,
      phone: mockPhone,
      created_at: mockDate,
      updated_at: mockDate,
    },
  };
}