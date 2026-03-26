import { User, UserRole } from "../generated/client";
import { buildBaseEvent } from "../logging/baseEventFactories";
import { EventCode } from "../types/eventCodes";
import { AuthInput } from "./user";
import { Operation } from "../logging/operations";
import {
  AuthBaseFailureEvent,
  AuthBaseSuccessEvent,
  ExecutionStatus,
  LoginFailureEvent,
  LoginSuccessEvent,
  LogoutSuccessEvent,
  MeFailureEvent,
  MeSuccessEvent,
  RegisterFailureEvent,
  RegisterSuccessEvent
} from "../logging/logSchemas";


// ==== Success ====

export function buildAuthBaseSuccessEvent(
  start: bigint,
  actorId: string,
  actorRole: UserRole,
  customerId: string,
  operation: Operation,
): AuthBaseSuccessEvent {
  return {
    ...buildBaseEvent(
      start, ExecutionStatus.SUCCESS, operation
    ),
    actorId,
    actorRole,
    customerId,
  }
}

export function buildRegisterSuccessEvent(
  start: bigint,
  userRecord: User,
  operation: Operation,
): RegisterSuccessEvent {
  return {
    ...buildAuthBaseSuccessEvent(
      start,
      userRecord.id,
      userRecord.role,
      userRecord.customer_id,
      operation,
    ),
    username: userRecord.username,
  }
}

export function buildLoginSuccessEvent(
  start: bigint,
  userRecord: User,
  operation: Operation,
): LoginSuccessEvent {
  return {
    ...buildAuthBaseSuccessEvent(
      start,
      userRecord.id,
      userRecord.role,
      userRecord.customer_id,
      operation,
    ),
    username: userRecord.username,
  }
}

export function buildLogoutSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  operation: Operation,
): LogoutSuccessEvent {
  return {
    ...buildAuthBaseSuccessEvent(
      start,
      actorData.actorId,
      actorData.role,
      actorData.customerId,
      operation,
    ),
  }
}

export function buildMeSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  operation: Operation,
): MeSuccessEvent {
  return {
    ...buildAuthBaseSuccessEvent(
      start,
      actorData.actorId,
      actorData.role,
      actorData.customerId,
      operation,
    ),
  }
}

// ==== Failure ====

export function buildAuthBaseFailureEvent(
  start: bigint,
  errorCode: EventCode,
  operation: Operation,
): AuthBaseFailureEvent {
  return {
    ...buildBaseEvent(
      start, ExecutionStatus.FAILURE, operation
    ),
    errorCode,
  }
}

export function buildRegisterFailureEvent(
  start: bigint,
  username: string,
  errorCode: EventCode,
  operation: Operation,
): RegisterFailureEvent {
  return {
    ...buildAuthBaseFailureEvent(
      start, errorCode, operation
    ),
    username,
  }
}

export function buildLoginFailureEvent(
  start: bigint,
  username: string,
  errorCode: EventCode,
  operation: Operation,
): LoginFailureEvent {
  return {
    ...buildAuthBaseFailureEvent(
      start, errorCode, operation
    ),
    username,
  }
}

export function buildMeFailureEvent(
  start: bigint,
  actorData: AuthInput,
  errorCode: EventCode,
  operation: Operation,
): MeFailureEvent {
  return {
    ...buildAuthBaseFailureEvent(
      start, errorCode, operation
    ),
    actorId: actorData.actorId,
    actorRole: actorData.role,
    customerId: actorData.customerId
  }
}
