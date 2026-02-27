import { AuthInput } from "../auth/user";
import { Account } from "../generated/client";
import type { AccountStatus, AccountType, UserRole } from "../generated/enums";
import { EventCode } from "../types/eventCodes";
import { logger } from "./logger";


export enum ExecutionStatus {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE"
}

export interface BaseEvent {
  executionStatus: ExecutionStatus;
  durationMs: number;
}

// ==== User ====
export interface AuthSuccessEvent extends BaseEvent {
  userId: string;
  username: string;
  userRole: UserRole;
}

export interface AuthFailureEvent extends BaseEvent {
  username: string;
  errorCode: string;
}

export interface AccountBaseEvent extends BaseEvent {
  actorId: string;
  actorRole: UserRole;
}

// ==== Account: (Success) ====
export interface SingleAccountSuccessEvent extends AccountBaseEvent {
  accountId: string;
  customerId: string;
  accountType: AccountType;
  currency: string;
  accountStatus: AccountStatus;
}

export interface ManyAccountSuccessEvent extends AccountBaseEvent {
  accounts: {
    accountId: string;
    customerId: string;
    accountType: AccountType;
    currency: string;
    accountStatus: AccountStatus;
  }[];
}

// ==== Account (Failure) ====
export interface AccountFailureBaseEvent extends AccountBaseEvent {
  errorCode: string;
}

export interface AccountFailByCustomerEvent extends AccountFailureBaseEvent {
  customerId: string;
  accountType: AccountType;
  currency: string;
  accountStatus?: AccountStatus;
}

export interface AccountFailByAccountEvent extends AccountFailureBaseEvent {
  accountId: string;
  nickname?: string;
  accountStatus?: AccountStatus;
}

export function logEvent(message: EventCode, event: BaseEvent) {
  logger.info(message, event);
}

export function mapToSingleAccountSuccessEvent(
  durationMs: number,
  actorData: AuthInput,
  accountRecord: Account
): SingleAccountSuccessEvent {
  return {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs,
    actorId: actorData.actorId,
    actorRole: actorData.role,
    accountId: accountRecord.id.toString(),
    customerId: accountRecord.customer_id.toString(),
    accountType: accountRecord.type,
    currency: accountRecord.currency,
    accountStatus: accountRecord.status,
  };
}

export function mapToManyAccountSuccessEvent(
  durationMs: number,
  actorData: AuthInput,
  accountRecords: Account[]
): ManyAccountSuccessEvent {
  return {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs,
    actorId: actorData.actorId,
    actorRole: actorData.role,
    accounts: accountRecords.map((accountRecord) => ({
      accountId: accountRecord.id.toString(),
      customerId: accountRecord.customer_id.toString(),
      accountType: accountRecord.type,
      currency: accountRecord.currency,
      accountStatus: accountRecord.status
    }))
  };
}