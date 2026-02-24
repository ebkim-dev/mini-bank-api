import type {
  RegisterInput,
  LoginInput,
  RegisterOutput,
  LoginOutput,
  JwtPayload,
} from './user';
import bcrypt from "bcrypt";
import prismaClient from '../db/prismaClient';
import { UserRole } from "../generated/enums";
import { Prisma } from "../generated/client";
import { ConflictError, UnauthorizedError } from "../error/error";
import { ErrorCode } from '../types/errorCodes';
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_EXPIRES_IN = 3_600_000; // 1h

export async function registerUser(
  data: RegisterInput
): Promise<RegisterOutput> {
  try { 
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userRecord = await prismaClient.user.create({ 
      data: {
        username: data.username,
        password_hash: hashedPassword,
        role: UserRole.STANDARD,
      }
    });

    const userOutput: RegisterOutput = { id: userRecord.id.toString() };

    return userOutput;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw ConflictError(ErrorCode.USERNAME_ALREADY_EXISTS, "Username already exists");
    }
    throw err;
  }
}

export async function loginUser(
  data: LoginInput
): Promise<LoginOutput> {
  const user = await prismaClient.user.findUnique({ 
    where: { username: data.username } 
  });

  if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
    throw UnauthorizedError(ErrorCode.INVALID_CREDENTIALS, "Invalid credentials");
  }
  
  const iat = Date.now();
  const exp = iat + JWT_EXPIRES_IN;
  
  const payload: JwtPayload = {
    sub: user.id.toString(),
    role: user.role,
    iat,
    exp,
  };

  const token = jwt.sign(payload, JWT_SECRET);

  return {
    token,
    expiresIn: JWT_EXPIRES_IN,
  };
}