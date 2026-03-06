<<<<<<< HEAD
import type { AccountStatus, AccountType, UserRole } from "../generated/enums";
=======
import { AuthInput } from "../auth/user";
import { Account, Transaction } from "../generated/client";
import type { AccountStatus, AccountType, TransactionType, UserRole } from "../generated/enums";
>>>>>>> f8ac299 (Implemented EPIC-2 (transactions). Also updated swagger and postman documentation.)
import { EventCode } from "../types/eventCodes";

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
  errorCode: EventCode;
}

export interface AccountBaseEvent extends BaseEvent {
  actorId: string;
  actorRole: UserRole;
  customerId: string;
}

// ==== Account: (Success) ====
export interface SingleAccountSuccessEvent extends AccountBaseEvent {
  accountId: string;
  accountType: AccountType;
  currency: string;
  accountStatus: AccountStatus;
}

export interface ManyAccountSuccessEvent extends AccountBaseEvent {
  accounts: {
    accountId: string;
    accountType: AccountType;
    currency: string;
    accountStatus: AccountStatus;
  }[];
}

// ==== Account (Failure) ====
export interface AccountFailureBaseEvent extends AccountBaseEvent {
  errorCode: EventCode;
}

export interface AccountFailByCustomerEvent extends AccountFailureBaseEvent {
  accountType: AccountType;
  currency: string;
  accountStatus?: AccountStatus;
}

export interface AccountFailByAccountEvent extends AccountFailureBaseEvent {
  accountId: string;
  nickname?: string;
  accountStatus?: AccountStatus;
}
<<<<<<< HEAD
=======

// ==== Transaction (Success) ====
export interface TransactionSuccessEvent extends AccountBaseEvent {
  transactionId?: string;
  accountId: string;
  transactionType?: TransactionType;
  amount?: string;
  count?: number;
}

// ==== Transaction (Failure) ====
export interface TransactionFailureEvent extends AccountBaseEvent {
  transactionId?: string;
  accountId?: string;
  errorCode: string;
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
    accountId: accountRecord.id,
    customerId: accountRecord.customer_id,
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
      accountId: accountRecord.id,
      customerId: accountRecord.customer_id,
      accountType: accountRecord.type,
      currency: accountRecord.currency,
      accountStatus: accountRecord.status
    }))
  };
}

export function mapToTransactionSuccessEvent(
  durationMs: number,
  actorData: AuthInput,
  transactionRecord: Transaction
): TransactionSuccessEvent {
  return {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs,
    actorId: actorData.actorId,
    actorRole: actorData.role,
    transactionId: transactionRecord.id,
    accountId: transactionRecord.account_id,
    transactionType: transactionRecord.type,
    amount: transactionRecord.amount.toString(),
  };
}

export function mapToManyTransactionSuccessEvent(
  durationMs: number,
  actorData: AuthInput,
  accountId: string,
  count: number
): TransactionSuccessEvent {
  return {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs,
    actorId: actorData.actorId,
    actorRole: actorData.role,
    accountId,
    count,
  };
}

export function mapToTransactionFailureEvent(
  durationMs: number,
  actorData: AuthInput,
  errorCode: string,
  transactionId?: string,
  accountId?: string
): TransactionFailureEvent {
  return {
    executionStatus: ExecutionStatus.FAILURE,
    durationMs,
    actorId: actorData.actorId,
    actorRole: actorData.role,
    errorCode,
    ...(transactionId && { transactionId }),
    ...(accountId && { accountId }),
  };
}
>>>>>>> f8ac299 (Implemented EPIC-2 (transactions). Also updated swagger and postman documentation.)
