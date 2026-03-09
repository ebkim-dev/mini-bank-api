jest.mock("crypto", () => ({
  randomUUID: jest.fn(),
}));
import { randomUUID } from "crypto";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { set: jest.fn() }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
import bcrypt from "bcrypt";

jest.mock('../../../src/db/prismaClient', () => ({
  __esModule: true,
  default: { user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  }}
}));
import prismaClient from '../../../src/db/prismaClient';

import { 
  buildAuthInput,
  buildLoginInput,
  buildLoginOutput,
  buildRegisterInput,
  buildRegisterOutput,
  buildUserRecord
} from "../../authMock";
import { 
  buildPrismaError,
  CONFLICT_ERROR_CODE,
  CONFLICT_ERROR_MESSAGE,
  UNKNOWN_ERROR_MESSAGE,
} from "../../errorMock";

import * as authService from "../../../src/auth/authService";
import { REDIS_SESSION_TTL_SEC } from "../../../src/auth/authService";
import { mockHashedPassword, mockRedisKey, mockSessionId } from "../../commonMock";

const mockCreate = prismaClient.user.create as jest.Mock;
const mockFindUnique = prismaClient.user.findUnique as jest.Mock;
const mockedRandomUUID = randomUUID as jest.Mock;
const mockRedisSet = redisClient.set as jest.Mock;
const mockHash = bcrypt.hash as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  mockHash.mockResolvedValue(mockHashedPassword);
});

describe("registerUser service", () => {
  it("should return user DTO given valid input", async () => {
    mockCreate.mockResolvedValue(buildUserRecord());

    await expect(
      authService.registerUser(buildRegisterInput())
    ).resolves.toMatchObject(buildRegisterOutput());
  });

  it("should throw an error for a duplicate username", async () => {
    mockCreate.mockRejectedValue(
      buildPrismaError(CONFLICT_ERROR_MESSAGE, CONFLICT_ERROR_CODE)
    );
   
    await expect(
      authService.registerUser(buildRegisterInput())
    ).rejects.toThrow("Username already exists");
  });
    
  it("should rethrow for an unknown error", async () => {
    const unknownError = new Error(UNKNOWN_ERROR_MESSAGE);

    mockCreate.mockRejectedValue(unknownError);
   
    await expect(
      authService.registerUser(buildRegisterInput())
    ).rejects.toThrow(unknownError);
  });
});

describe("loginUser service", () => {
  it("should return sessionId given valid input", async() => {
    mockFindUnique.mockResolvedValue(buildUserRecord());
    mockCompare.mockResolvedValue(true);
    mockRedisSet.mockResolvedValue("OK");
    mockedRandomUUID.mockReturnValue(mockSessionId);

    const result = await authService.loginUser(buildLoginInput());

    expect(result).toMatchObject(buildLoginOutput());
    expect(mockRedisSet).toHaveBeenCalledWith(
      mockRedisKey,
      JSON.stringify(buildAuthInput()),
      { expiration: { type: "EX", value: REDIS_SESSION_TTL_SEC } }
    );
  });

  it("should throw an error if username is not found", async () => {
    mockFindUnique.mockResolvedValue(null);
   
    await expect(
      authService.loginUser(buildLoginInput())
    ).rejects.toThrow("Invalid credentials");
  });

  it("should throw an error if password is incorrect", async () => {
    mockFindUnique.mockResolvedValue(buildUserRecord());
    mockCompare.mockResolvedValue(false);
   
    await expect(
      authService.loginUser(buildLoginInput())
    ).rejects.toThrow("Invalid credentials");
  });
});