import { User, UserRole } from "../src/generated/client";
import { 
  AuthInput,
  LoginInput,
  LoginOutput,
  RegisterInput,
  RegisterOutput
} from "../src/auth/user";
import {
  mockHashedPassword,
  mockPassword,
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
  const mockUserRecord: User = {
    id: mockUserId,
    username: mockUsername,
    password_hash: mockHashedPassword,
    role: UserRole.ADMIN,
    created_at: mockDate,
    updated_at: mockDate,
    ...overrides,
  };
  return mockUserRecord;
}

export function buildAuthInput(
  overrides: Partial<AuthInput> = {}
): AuthInput {
  return {
    actorId: mockUserId,
    role: UserRole.ADMIN,
    ...overrides,
  };
}
