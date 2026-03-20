jest.mock("../../../src/utils/encryption", () => ({
  encrypt: jest.fn(() => mockEncryptedRedisPayload)
}));
import { encrypt } from "../../../src/utils/encryption";

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

const mockUserCreate = jest.fn();
const mockCustomerCreate = jest.fn();

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(async (callback) => {
      return callback({
        user: { create: mockUserCreate },
        customer: { create: mockCustomerCreate },
      });
    }),
    user: {
      findUnique: jest.fn(),
    }
  },
}));
import prismaClient from "../../../src/db/prismaClient";

import { 
  buildAuthInput,
  buildCustomerRecord,
  buildLoginInput,
  buildLoginOutput,
  buildRegisterInput,
  buildRegisterOutput,
  buildUserRecord,
  mockEncryptedRedisPayload
} from "../../authMock";
import { 
  buildPrismaError,
  CONFLICT_ERROR_CODE,
  CONFLICT_ERROR_MESSAGE,
  UNKNOWN_ERROR_MESSAGE,
} from "../../errorMock";
import {
  mockCustomerId1,
  mockHashedPassword,
  mockPhone,
  mockRedisKey,
  mockSessionId
} from "../../commonMock";

import * as authService from "../../../src/auth/authService";
import { REDIS_SESSION_TTL_SEC } from "../../../src/auth/authService";
import { LoginOutput } from "../../../src/auth/user";

const mockFindUnique = prismaClient.user.findUnique as jest.Mock;
const mockRandomUUID = randomUUID as jest.Mock;
const mockRedisSet = redisClient.set as jest.Mock;
const mockEncrypt = encrypt as jest.Mock;
const mockHash = bcrypt.hash as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  mockHash.mockResolvedValue(mockHashedPassword);
  mockCustomerCreate.mockResolvedValue(
    buildCustomerRecord({ id: mockCustomerId1 })
  );
  mockUserCreate.mockResolvedValue(buildUserRecord());
});

describe("registerUser service", () => {
  it("should return user DTO given valid input", async () => {
    await expect(authService.registerUser(
      buildRegisterInput({
        phone: mockPhone
      }))).resolves.toMatchObject(buildRegisterOutput());
  });

  it("should return user DTO without optional fields", async () => {
    await expect(authService.registerUser(
      buildRegisterInput()
    )).resolves.toMatchObject(buildRegisterOutput());
  });

  it("should throw an error for a duplicate username", async () => {
    const err = buildPrismaError(CONFLICT_ERROR_MESSAGE, CONFLICT_ERROR_CODE);
    err.meta = { target: ["username"] };

    mockUserCreate.mockRejectedValue(err);
   
    await expect(
      authService.registerUser(buildRegisterInput())
    ).rejects.toThrow("username already exists");
  });

  it("should throw an error for a duplicate email", async () => {
    const err = buildPrismaError(CONFLICT_ERROR_MESSAGE, CONFLICT_ERROR_CODE);
    err.meta = { target: ["email"] };

    mockUserCreate.mockRejectedValue(err);
   
    await expect(
      authService.registerUser(buildRegisterInput())
    ).rejects.toThrow("email already exists");
  })

  it("should throw an error given a singular err.meta.target", async () => {
    const err = buildPrismaError(CONFLICT_ERROR_MESSAGE, CONFLICT_ERROR_CODE);
    err.meta = { target: "not-an-array" };

    mockUserCreate.mockRejectedValue(err);
   
    await expect(
      authService.registerUser(buildRegisterInput())
    ).rejects.toThrow("Unique constraint failed");
  });

  it("should throw an error for an unknown conflict", async () => {
    const err = buildPrismaError(CONFLICT_ERROR_MESSAGE, CONFLICT_ERROR_CODE);
    err.meta = { target: ["unknown"] };

    mockUserCreate.mockRejectedValue(err);
   
    await expect(
      authService.registerUser(buildRegisterInput())
    ).rejects.toThrow("Unique constraint failed");
  });
    
  it("should rethrow for an unknown error", async () => {
    const unknownError = new Error(UNKNOWN_ERROR_MESSAGE);

    mockUserCreate.mockRejectedValue(unknownError);
   
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
    mockRandomUUID.mockReturnValue(mockSessionId);
    mockEncrypt.mockReturnValue(JSON.stringify(buildAuthInput()));

    const result: LoginOutput = await authService.loginUser(
      buildLoginInput()
    );

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