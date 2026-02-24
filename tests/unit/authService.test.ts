
jest.mock('../../src/db/prismaClient', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prismaClient from '../../src/db/prismaClient'
import * as authService from "../../src/auth/authService";
import { Prisma, User } from "../../src/generated/client";
import { UserRole } from "../../src/generated/enums"
import { 
  RegisterOutput,
  LoginInput, 
  LoginOutput, 
  RegisterInput,
} from "../../src/auth/user";

const mockRegisterInput: RegisterInput = {
  username: "mockUser",
  password: "12341234",
};
const currentDate = new Date();
const mockRegisterOutput: RegisterOutput = {
  id: 42n.toString(),
};

const mockLoginInput: LoginInput = {
  username: "mockUser",
  password: "12341234",
};
const mockLoginOutput: LoginOutput = {
  token: "my_json_web_token",
  expiresIn: authService.JWT_EXPIRES_IN,
};

const mockUserRecord: User = {
  id: 42n,
  username: "mockUser",
  password_hash: "hashedpw",
  role: UserRole.ADMIN,
  created_at: currentDate,
  updated_at: currentDate,
};

afterEach(() => {
  jest.resetAllMocks();
});

describe("registerUser service", () => {
  it("should return user DTO given valid input", async() => {
    (prismaClient.user.create as jest.Mock).mockResolvedValue(mockUserRecord);
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashedpw" as never);

    await expect(
      authService.registerUser(mockRegisterInput)
    ).resolves.toMatchObject(mockRegisterOutput);
  });

  it("should throw an error for a duplicate username", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      { code: "P2002", clientVersion: "test" }
    );

    (prismaClient.user.create  as jest.Mock).mockRejectedValue(prismaError);
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashedpw" as never);
   
    await expect(
      authService.registerUser(mockRegisterInput)
    ).rejects.toThrow("Username already exists");
  });
});

describe("loginUser service", () => {
  it("should return jwt given valid input", async() => {
    (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUserRecord);
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
    jest.spyOn(jwt, "sign").mockReturnValue("my_json_web_token" as never);

    await expect(
      authService.loginUser(mockLoginInput)
    ).resolves.toMatchObject(mockLoginOutput);
  });

  it("should throw an error if username is not found", async () => {
    (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(null);
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashedpw" as never);
   
    await expect(
      authService.loginUser(mockLoginInput)
    ).rejects.toThrow("Invalid credentials");
  });

  it("should throw an error if password is incorrect", async () => {
    (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUserRecord);
    jest.spyOn(bcrypt, "compare").mockResolvedValue(false as never);
   
    await expect(
      authService.loginUser(mockLoginInput)
    ).rejects.toThrow("Invalid credentials");
  });
});