import type {
  UserRegisterInput,
  UserLoginInput,
  UserOutput,
  LoginOutput,
} from '../types/user';
import bcrypt from "bcrypt";
import prismaClient from '../db/prismaClient';
import { UserRole } from "../generated/enums";
import { Prisma } from "../generated/client";
import { ConflictError } from "../error/error";
import { ErrorCode } from '../types/errorCodes';

export async function registerUser(
  data: UserRegisterInput
): Promise<UserOutput> {
  try { 
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userRecord = await prismaClient.user.create({ 
      data: {
        username: data.username,
        password_hash: hashedPassword,
        role: UserRole.STANDARD,
      }
    });

    const userOutput: UserOutput = {
      id: userRecord.id,
      username: userRecord.username,
      role: userRecord.role,
      created_at: userRecord.created_at,
      updated_at: userRecord.updated_at,
    }

    return userOutput;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw ConflictError(ErrorCode.USERNAME_ALREADY_EXISTS, "Username already exists");
    }
    throw err;
  }
}