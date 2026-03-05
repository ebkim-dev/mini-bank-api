import { LoginInput, LoginOutput, RegisterInput, RegisterOutput } from "../../../src/auth/user";
import { User, UserRole } from "../../../src/generated/client";

export const mockSessionId: string = "550e8400-e29b-41d4-a716-000000000000";
export const mockRedisKey: string = `session:${mockSessionId}`;
export const mockCustomerId = "550e8400-e29b-41d4-a716-446655440000";
export const mockAccountId1 = "550e8400-e29b-41d4-a716-446655440001";
export const mockAccountId2 = "550e8400-e29b-41d4-a716-446655440002";
export const mockMissingCustomerId = "550e8400-e29b-41d4-a716-44665544eeee";
export const mockMissingAccountId = "550e8400-e29b-41d4-a716-44665544ffff";

export const mockUserId = "550e8400-e29b-41d4-a716-446655440099";
export const mockMissingUserId = "550e8400-e29b-41d4-a716-446655440098";
export const mockUsername = "mockUser";
export const mockPassword = "mockPassword";
export const mockHashedPassword = "hashedMockPassword"

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