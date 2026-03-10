import bcrypt from "bcrypt";
import prismaClient from '../db/prismaClient';
import { UserRole } from "../generated/enums";
import { Prisma } from "../generated/client";
import { EventCode } from '../types/eventCodes';
import { getDurationMs } from '../utils/calculateDuration';
import { ConflictError, UnauthorizedError } from "../error/error";
import { redisClient } from '../redis/redisClient';
import { randomUUID } from "crypto";
import { encrypt } from "../utils/encryption";
import { 
  ExecutionStatus, 
  AuthSuccessEvent, 
  logEvent, 
  AuthFailureEvent
} from '../logging/logSchemas';
import type {
  RegisterInput,
  LoginInput,
  RegisterOutput,
  LoginOutput,
  AuthInput,
} from './user';

export const REDIS_SESSION_TTL_SEC = 900; // 15min

export async function registerUser(
  data: RegisterInput
): Promise<RegisterOutput> {
  const startTime = process.hrtime.bigint();
  try {
    const userRecord = await prismaClient.$transaction(async (tx) => {
      const createdCustomer = await tx.customer.create({
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone ?? null,
        }
      });
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const createdUser = await tx.user.create({ 
        data: {
          customer_id: createdCustomer.id,
          username: data.username,
          password_hash: hashedPassword,
          role: UserRole.STANDARD,
        }
      });

      return createdUser;
    });

    const userOutput: RegisterOutput = { 
      id: userRecord.id
    };
    
    const event: AuthSuccessEvent = {
      executionStatus: ExecutionStatus.SUCCESS,
      durationMs: getDurationMs(startTime),
      userId: userRecord.id,
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
      const field = Array.isArray(err.meta?.target) ? err.meta.target[0] : "unknown";
      const event: AuthFailureEvent = {
        executionStatus: ExecutionStatus.FAILURE,
        durationMs: getDurationMs(startTime),
        username: data.username,
        errorCode: EventCode.UNKNOWN_CONFLICT
      };
      if (field === "username") {
        event.errorCode = EventCode.USERNAME_ALREADY_EXISTS;
      } else if (field === "email") {
        event.errorCode = EventCode.EMAIL_ALREADY_EXISTS;
      }

      logEvent(event.errorCode, event);
      
      throw ConflictError(event.errorCode, `${field} already exists`);
    }
    throw err;
  }
}

export async function loginUser(
  data: LoginInput
): Promise<LoginOutput> {
  const startTime = process.hrtime.bigint();

  const userRecord = await prismaClient.user.findUnique({ 
    where: { username: data.username } 
  });

  if (
    !userRecord || 
    !(await bcrypt.compare(data.password, userRecord.password_hash))
  ) {
    const event: AuthFailureEvent = {
      executionStatus: ExecutionStatus.FAILURE,
      durationMs: getDurationMs(startTime),
      username: data.username,
      errorCode: EventCode.INVALID_CREDENTIALS
    };
    logEvent(EventCode.INVALID_CREDENTIALS, event);

    throw UnauthorizedError(
      EventCode.INVALID_CREDENTIALS, 
      "Invalid credentials"
    );
  }
  
  const payload: AuthInput = {
    actorId: userRecord.id,
    role: userRecord.role,
  };
  
  const sessionId = randomUUID();
  await redisClient.set(
    `session:${sessionId}`,
    encrypt(JSON.stringify(payload)),
    { expiration: { type: "EX", value: REDIS_SESSION_TTL_SEC } }
  );
    
  const event: AuthSuccessEvent = {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs: getDurationMs(startTime),
    userId: userRecord.id.toString(),
    username: userRecord.username,
    userRole: userRecord.role
  };
  logEvent(EventCode.LOGIN_SUCCESS, event);

  return { sessionId };
}