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
import { EventCode } from '../types/eventCodes';
import jwt from "jsonwebtoken";
import { 
  ExecutionStatus, 
  AuthSuccessEvent, 
  logEvent, 
  AuthFailureEvent
} from '../logging/logSchemas';
import { getDurationMs } from '../utils/calculateDuration';

const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_EXPIRES_IN = 3_600_000; // 1h

export async function registerUser(
  data: RegisterInput
): Promise<RegisterOutput> {
  const start = process.hrtime.bigint();
  try { 
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userRecord = await prismaClient.user.create({ 
      data: {
        username: data.username,
        password_hash: hashedPassword,
        role: UserRole.STANDARD,
      }
    });

    const serializedId = userRecord.id.toString();
    const userOutput: RegisterOutput = { id: serializedId };
    
    const event: AuthSuccessEvent = {
      executionStatus: ExecutionStatus.SUCCESS,
      durationMs: getDurationMs(start),
      userId: serializedId,
      username: userRecord.username,
      userRole: userRecord.role
    };
    logEvent(EventCode.USER_REGISTERED, event);

    return userOutput;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError && 
      err.code === "P2002"
    ) {
      const event: AuthFailureEvent = {
        executionStatus: ExecutionStatus.FAILURE,
        durationMs: getDurationMs(start),
        username: data.username,
        errorCode: EventCode.USERNAME_ALREADY_EXISTS
      };
      logEvent(EventCode.USERNAME_ALREADY_EXISTS, event);
      
      throw ConflictError(
        EventCode.USERNAME_ALREADY_EXISTS, 
        "Username already exists"
      );
    }
    throw err;
  }
}

export async function loginUser(
  data: LoginInput
): Promise<LoginOutput> {
  const start = process.hrtime.bigint();

  const userRecord = await prismaClient.user.findUnique({ 
    where: { username: data.username } 
  });

  if (
    !userRecord || 
    !(await bcrypt.compare(data.password, userRecord.password_hash))
  ) {
    const event: AuthFailureEvent = {
      executionStatus: ExecutionStatus.FAILURE,
      durationMs: getDurationMs(start),
      username: data.username,
      errorCode: EventCode.INVALID_CREDENTIALS
    };
    logEvent(EventCode.INVALID_CREDENTIALS, event);

    throw UnauthorizedError(
      EventCode.INVALID_CREDENTIALS, 
      "Invalid credentials"
    );
  }
  
  const serializedId = userRecord.id.toString();
  const iat = Date.now();
  const exp = iat + JWT_EXPIRES_IN;
  
  const payload: JwtPayload = {
    sub: userRecord.id.toString(),
    role: userRecord.role,
    iat,
    exp,
  };

  const token = jwt.sign(payload, JWT_SECRET);
    
  const event: AuthSuccessEvent = {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs: getDurationMs(start),
    userId: serializedId,
    username: userRecord.username,
    userRole: userRecord.role
  };
  logEvent(EventCode.LOGIN_SUCCESS, event);

  return {
    token,
    expiresIn: JWT_EXPIRES_IN,
  };
}