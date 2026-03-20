import type { AccountStatus, AccountType, TransactionType, UserRole } from "../generated/enums";
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

export interface LogoutSuccessEvent extends BaseEvent {
  userId: string;
  userRole: UserRole;
}
 
export interface MeSuccessEvent extends BaseEvent {
  userId: string;
  userRole: UserRole;
  customerId: string;
}

export interface MeFailureEvent extends BaseEvent {
  userId: string;
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
