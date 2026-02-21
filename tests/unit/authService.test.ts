
jest.mock('../../src/db/prismaClient', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
    },
  },
}));

import * as authService from "../../src/auth/authService";
import prismaClient from '../../src/db/prismaClient'
import { Prisma } from "../../src/generated/client";
import { UserOutput, UserRegisterInput } from "../../src/types/user";
import { UserRole } from "../../src/generated/enums"
import bcrypt from "bcrypt";

const mockUserInput: UserRegisterInput = {
  username: "mockUser",
  password: "12341234",
};
const currentDate = new Date();
const mockUserOutput: UserOutput = {
  id: 42n,
  username: "mockUser",
  role: UserRole.ADMIN,
  created_at: currentDate,
  updated_at: currentDate,
};

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe("insertAccount service", () => {
  it("should return user DTO given valid input", async() => {

    const mockUserRecord = {
      id: 42n,
      username: "mockUser",
      password_hash: "hashedpw",
      role: UserRole.ADMIN,
      created_at: currentDate,
      updated_at: currentDate,
    };

    (prismaClient.user.create as jest.Mock).mockResolvedValue(mockUserRecord);

    await expect(
      authService.registerUser(mockUserInput)
    ).resolves.toMatchObject(mockUserOutput);
  });

  it("should throw an error for a duplicate username", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      { code: "P2002", clientVersion: "test" }
    );

    (prismaClient.user.create  as jest.Mock).mockRejectedValue(prismaError);
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashedpw" as never);
   
    await expect(
      authService.registerUser(mockUserInput)
    ).rejects.toThrow("Username already exists");
  });
});