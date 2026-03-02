import * as authService from "../../../src/auth/authService";
import jwt from "jsonwebtoken";
import { Prisma, User } from "../../../src/generated/client";
import { UserRole } from "../../../src/generated/enums";
import { REDIS_SESSION_TTL_SEC } from "../../../src/auth/authService";
import { 
  RegisterOutput,
  LoginInput, 
  LoginOutput, 
  RegisterInput,
} from "../../../src/auth/user";

jest.mock('../../../src/db/prismaClient', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));
import prismaClient from '../../../src/db/prismaClient';


const CUSTOMER_ID = "550e8400-e29b-41d4-a716-446655440000";
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


const mockRegisterInput: RegisterInput = {
  username: "mockUser",
  password: "12341234",
};

const mockRegisterOutput: RegisterOutput = {
  id: CUSTOMER_ID,
};

const mockLoginInput: LoginInput = {
  username: "mockUser",
  password: "12341234",
};
const mockLoginOutput: LoginOutput = {
  sessionId: "mockSessionId",
};

const mockDate = new Date();
const mockUserRecord: User = {
  id: CUSTOMER_ID,
  username: "mockUser",
  password_hash: "hashedpw",
  role: UserRole.ADMIN,
  created_at: mockDate,
  updated_at: mockDate,
};


const mockCreate = prismaClient.user.create as jest.Mock;
const mockFindUnique = prismaClient.user.findUnique as jest.Mock;
const mockedRandomUUID = randomUUID as jest.Mock;
const mockRedisSet = redisClient.set as jest.Mock;
const mockHash = bcrypt.hash as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;
beforeEach(() => {
  mockCreate.mockResolvedValue(mockUserRecord);
  mockFindUnique.mockResolvedValue(mockUserRecord);
  mockHash.mockResolvedValue("hashedpw");
});
afterEach(() => {
  jest.resetAllMocks();
});


describe("registerUser service", () => {
  it("should return user DTO given valid input", async () => {
    mockCreate.mockResolvedValue(mockUserRecord);

    await expect(
      authService.registerUser(mockRegisterInput)
    ).resolves.toMatchObject(mockRegisterOutput);
  });

  it("should throw an error for a duplicate username", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      { code: "P2002", clientVersion: "test" }
    );

    mockCreate.mockRejectedValue(prismaError);
   
    await expect(
      authService.registerUser(mockRegisterInput)
    ).rejects.toThrow("Username already exists");
  });
});

describe("loginUser service", () => {
  it("should return jwt given valid input", async() => {
    mockFindUnique.mockResolvedValue(mockUserRecord);
    mockCompare.mockResolvedValue(true);
    jest.spyOn(jwt, "sign").mockReturnValue("my_json_web_token" as never);
    mockRedisSet.mockResolvedValue("OK");
    mockedRandomUUID.mockReturnValue("mockSessionId");

    const result = await authService.loginUser(mockLoginInput);

    expect(result).toMatchObject(mockLoginOutput);
    expect(mockRedisSet).toHaveBeenCalledWith(
      expect.stringMatching(/^session:/),
      "my_json_web_token",
      { EX: REDIS_SESSION_TTL_SEC }
    );
  });

  it("should throw an error if username is not found", async () => {
    mockFindUnique.mockResolvedValue(null);
   
    await expect(
      authService.loginUser(mockLoginInput)
    ).rejects.toThrow("Invalid credentials");
  });

  it("should throw an error if password is incorrect", async () => {
    mockFindUnique.mockResolvedValue(mockUserRecord);
    mockCompare.mockResolvedValue(false);
   
    await expect(
      authService.loginUser(mockLoginInput)
    ).rejects.toThrow("Invalid credentials");
  });
});