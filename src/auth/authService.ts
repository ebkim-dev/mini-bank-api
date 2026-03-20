import bcrypt from "bcrypt";
import prismaClient from '../db/prismaClient';
import { UserRole } from "../generated/enums";
import { Prisma } from "../generated/client";
import { EventCode } from '../types/eventCodes';
import { getDurationMs } from '../utils/calculateDuration';
import { ConflictError, NotFoundError, UnauthorizedError } from "../error/error";
import { redisClient } from '../redis/redisClient';
import { randomUUID } from "crypto";
import { encrypt } from "../utils/encryption";
import { logger } from '../logging/logger';
import { 
  ExecutionStatus, 
  AuthSuccessEvent, 
  AuthFailureEvent,
  MeSuccessEvent,
  LogoutSuccessEvent,
  MeFailureEvent
} from '../logging/logSchemas';
import type {
  RegisterInput,
  LoginInput,
  RegisterOutput,
  LoginOutput,
  AuthInput,
  MeOutput,
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
    logger.info(EventCode.USER_REGISTERED, event);

    return userOutput;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError && 
      err.code === "P2002"
    ) {
      const event: AuthFailureEvent = {
        executionStatus: ExecutionStatus.FAILURE,
        durationMs: getDurationMs(startTime),
        username: data.username,
        errorCode: EventCode.UNKNOWN_CONFLICT
      };
      const target = err.meta?.target;
      const driverMessage: string | undefined =
        (err.meta as any)?.driverAdapterError?.cause?.originalMessage;
 
      let field: string | undefined;
      if (Array.isArray(target)) {
        field = target[0];
      } else if (typeof target === "string") {
        if (target.includes("username")) field = "username";
        else if (target.includes("email")) field = "email";
      }
 
      if (!field && driverMessage) {
        if (driverMessage.includes("username")) field = "username";
        else if (driverMessage.includes("email")) field = "email";
      }
 
      if (!field || (field !== "username" && field !== "email")) {
        logger.info(event.errorCode, event);
        throw err;
      }
 
      if (field === "username") {
        event.errorCode = EventCode.USERNAME_ALREADY_EXISTS;
      } else {
        event.errorCode = EventCode.EMAIL_ALREADY_EXISTS;
      }
 
      logger.info(event.errorCode, event);
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
    logger.info(EventCode.INVALID_CREDENTIALS, event);

    throw UnauthorizedError(
      EventCode.INVALID_CREDENTIALS, 
      "Invalid credentials"
    );
  }
  
  const payload: AuthInput = {
    actorId: userRecord.id,
    role: userRecord.role,
    customerId: userRecord.customer_id,
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
  logger.info(EventCode.LOGIN_SUCCESS, event);

  return { sessionId };
}


export async function logoutUser(
  sessionId: string,
  authInput: AuthInput
): Promise<void> {
  const startTime = process.hrtime.bigint();
 
  await redisClient.del(`session:${sessionId}`);
 
  const event: LogoutSuccessEvent = {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs: getDurationMs(startTime),
    userId: authInput.actorId,
    userRole: authInput.role,
  };
  logger.info(EventCode.LOGOUT_SUCCESS, event);
}
 
export async function fetchMe(
  authInput: AuthInput
): Promise<MeOutput> {
  const startTime = process.hrtime.bigint();
 
  const userRecord = await prismaClient.user.findUnique({
    where: { id: authInput.actorId },
    include: { customer: true },
  });
 
  if (!userRecord) {
    const event: MeFailureEvent = {
      executionStatus: ExecutionStatus.FAILURE,
      durationMs: getDurationMs(startTime),
      userId: authInput.actorId,
      errorCode: EventCode.INTERNAL_SERVER_ERROR,
    };
    logger.info(EventCode.INTERNAL_SERVER_ERROR, event);
    throw NotFoundError(EventCode.INTERNAL_SERVER_ERROR, "User not found");
  }
 
  const event: MeSuccessEvent = {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs: getDurationMs(startTime),
    userId: userRecord.id,
    userRole: userRecord.role,
    customerId: userRecord.customer_id,
  };
  logger.info(EventCode.ME_FETCHED, event);
 
  return {
    username: userRecord.username,
    role: userRecord.role,
    customer: {
      id: userRecord.customer.id,
      firstName: userRecord.customer.first_name,
      lastName: userRecord.customer.last_name,
      email: userRecord.customer.email,
      phone: userRecord.customer.phone,
    },
  };
}