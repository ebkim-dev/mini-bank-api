import bcrypt from "bcrypt";
import prismaClient from '../db/prismaClient';
import { UserRole } from "../generated/enums";
import { Prisma } from "../generated/client";
import { EventCode } from '../types/eventCodes';
import { ConflictError, NotFoundError, UnauthorizedError } from "../error/error";
import { redisClient } from '../redis/redisClient';
import { randomUUID } from "crypto";
import { encrypt } from "../utils/encryption";
import { logger } from '../logging/logger';
import { serializeMe } from "./authUtils";
import {
  throwIfInvalidPassword,
  throwIfUserNotFound
} from "./authAssertions";
import {
  buildLoginFailureEvent,
  buildLoginSuccessEvent,
  buildLogoutSuccessEvent,
  buildMeFailureEvent,
  buildMeSuccessEvent,
  buildRegisterFailureEvent,
  buildRegisterSuccessEvent
} from "./authEventFactories";
import type {
  RegisterInput,
  LoginInput,
  RegisterOutput,
  LoginOutput,
  AuthInput,
  MeOutput,
} from './user';
import { ErrorMessages } from "../error/errorMessages";
 
 
export const REDIS_SESSION_TTL_SEC = 300;        // 15 min — initial TTL on login
export const EXTENSION_THRESHOLD_SEC = 180;      // extend if TTL drops below 3 min
export const EXTENSION_AMOUNT_SEC = 300;         // extend by 5 min from now
 
export async function registerUser(
  data: RegisterInput
): Promise<RegisterOutput> {
  const start = process.hrtime.bigint();
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
 
      const createdUser = await tx.user.create({
        data: {
          customer_id: createdCustomer.id,
          username: data.username,
          password_hash: await bcrypt.hash(data.password, 10),
          role: UserRole.STANDARD,
        }
      });
 
      return createdUser;
    });
   
    logger.info(
      EventCode.USER_REGISTERED,
      buildRegisterSuccessEvent(start, userRecord)
    );
 
    return { id: userRecord.id };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
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
 
      const event = buildRegisterFailureEvent(
        start, data.username, EventCode.UNKNOWN_CONFLICT
      );
 
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
  const start = process.hrtime.bigint();
 
  const userRecord = await prismaClient.user.findUnique({
    where: { username: data.username }
  });
 
  try {
    throwIfUserNotFound(userRecord);
  } catch (err) {
    logger.info(buildLoginFailureEvent(
      start, data.username, EventCode.USER_NOT_FOUND,
    ));
    throw UnauthorizedError(
      EventCode.INVALID_CREDENTIALS,
      ErrorMessages.INVALID_CREDENTIALS
    );
  }
 
  try {
    await throwIfInvalidPassword(userRecord, data.password);
  } catch (err) {
    logger.info(buildLoginFailureEvent(
      start, data.username, EventCode.INVALID_CREDENTIALS,
    ));
    throw err;
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
 
  logger.info(
    EventCode.LOGIN_SUCCESS,
    buildLoginSuccessEvent(start, userRecord)
  );
 
  return { sessionId };
}
 
 
export async function logoutUser(
  sessionId: string,
  authInput: AuthInput
): Promise<void> {
  const start = process.hrtime.bigint();
 
  await redisClient.del(`session:${sessionId}`);
 
  logger.info(
    EventCode.LOGOUT_SUCCESS,
    buildLogoutSuccessEvent(start, authInput)
  );
}
 
 
export async function fetchMe(
  authInput: AuthInput
): Promise<MeOutput> {
  const start = process.hrtime.bigint();
 
  const userRecord = await prismaClient.user.findUnique({
    where: { id: authInput.actorId },
    include: { customer: true },
  });
 
  try {
    throwIfUserNotFound(userRecord);
  } catch (err) {
    logger.info(buildMeFailureEvent(
      start, authInput, EventCode.USER_NOT_FOUND
    ));
    throw NotFoundError(
      EventCode.USER_NOT_FOUND, ErrorMessages.USER_NOT_FOUND
    );
  }
 
  logger.info(
    EventCode.ME_FETCHED,
    buildMeSuccessEvent(start, authInput)
  );
 
  return serializeMe(userRecord);
}