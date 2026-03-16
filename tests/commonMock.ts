import { Decimal } from "@prisma/client/runtime/client";

export const mockSessionId         = "550e8400-e29b-41d4-a716-000000000000";
export const mockRedisKey          = `session:${mockSessionId}`;

export const mockUserId            = "550e8400-e29b-41d4-a716-446655440000";
export const mockMissingUserId     = "550e8400-e29b-41d4-a716-44665544000f";
export const mockCustomerId1       = "550e8400-e29b-41d4-a716-446655440010";
export const mockCustomerId2       = "550e8400-e29b-41d4-a716-446655440011";
export const mockMissingCustomerId = "550e8400-e29b-41d4-a716-44665544001f";
export const mockAccountId1        = "550e8400-e29b-41d4-a716-446655440020";
export const mockAccountId2        = "550e8400-e29b-41d4-a716-446655440021";
export const mockMissingAccountId  = "550e8400-e29b-41d4-a716-44665544002f";
export const mockTransferId1        = "550e8400-e29b-41d4-a716-446655440030";
export const mockTransferId2        = "550e8400-e29b-41d4-a716-446655440031";

export const mockUsername       = "mockUser";
export const mockPassword       = "mockPassword";
export const mockHashedPassword = "hashedMockPassword";
export const mockFirstName      = "mockFirstName";
export const mockLastName       = "mockLastName";
export const mockEmail          = "mockEmail@mock.com";
export const mockPhone          = "1234567890";

export const mockAmount = new Decimal(50);

export const mockFromDate = new Date("2026-02-01T00:00:00.000Z");
export const mockToDate = new Date("2026-03-01T00:00:00.000Z");