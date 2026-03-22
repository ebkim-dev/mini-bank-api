import { User, UserRole } from "../generated/client";
import { buildBaseEvent } from "../logging/baseEventFactories";
import { EventCode } from "../types/eventCodes";
import { AuthInput } from "./user";
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
): AuthBaseSuccessEvent {
  return {
    ...buildBaseEvent(start, ExecutionStatus.SUCCESS),
    actorId,
    actorRole,
    customerId,
  }
}

export function buildRegisterSuccessEvent(
  start: bigint,
  userRecord: User,
): RegisterSuccessEvent {
  return {
    ...buildAuthBaseSuccessEvent(
      start,
      userRecord.id,
      userRecord.role,
      userRecord.customer_id,
    ),
    username: userRecord.username,
  }
}

export function buildLoginSuccessEvent(
  start: bigint,
  userRecord: User,
): LoginSuccessEvent {
  return {
    ...buildAuthBaseSuccessEvent(
      start,
      userRecord.id,
      userRecord.role,
      userRecord.customer_id,
    ),
    username: userRecord.username,
  }
}

export function buildLogoutSuccessEvent(
  start: bigint,
  actorData: AuthInput,
): LogoutSuccessEvent {
  return {
    ...buildAuthBaseSuccessEvent(
      start,
      actorData.actorId,
      actorData.role,
      actorData.customerId,
    ),
  }
}

export function buildMeSuccessEvent(
  start: bigint,
  actorData: AuthInput,
): MeSuccessEvent {
  return {
    ...buildAuthBaseSuccessEvent(
      start,
      actorData.actorId,
      actorData.role,
      actorData.customerId,
    ),
  }
}

// ==== Failure ====

export function buildAuthBaseFailureEvent(
  start: bigint,
  errorCode: EventCode,
): AuthBaseFailureEvent {
  return {
    ...buildBaseEvent(start, ExecutionStatus.FAILURE),
    errorCode,
  }
}

export function buildRegisterFailureEvent(
  start: bigint,
  username: string,
  errorCode: EventCode,
): RegisterFailureEvent {
  return {
    ...buildAuthBaseFailureEvent(start, errorCode),
    username,
  }
}

export function buildLoginFailureEvent(
  start: bigint,
  username: string,
  errorCode: EventCode,
): LoginFailureEvent {
  return {
    ...buildAuthBaseFailureEvent(start, errorCode),
    username,
  }
}

export function buildMeFailureEvent(
  start: bigint,
  actorData: AuthInput,
  errorCode: EventCode,
): MeFailureEvent {
  return {
    ...buildAuthBaseFailureEvent(start, errorCode),
    actorId: actorData.actorId,
    actorRole: actorData.role,
    customerId: actorData.customerId
  }
}
