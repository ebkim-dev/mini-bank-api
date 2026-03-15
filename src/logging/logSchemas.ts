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

// ==== Account ====

export interface AccountBaseEvent extends BaseEvent {
  actorId: string;
  actorRole: UserRole;
  customerId: string;
}

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

export interface AccountFailureEvent extends AccountBaseEvent {
  errorCode: EventCode;
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
// ==== Transfer ====

export interface TransferBaseEvent extends BaseEvent {
  actorId: string;
  actorRole: UserRole;
  customerId: string;
}

export interface SingleTransferSuccessEvent extends TransferBaseEvent {
  transferId: string;
  fromAccountId: string;
  toAccountId: String;
  amount: string;
}

export interface ManyTransferSuccessEvent extends TransferBaseEvent {
  transfers: {
    transferId: string;
    fromAccountId: string;
    toAccountId: string;
    amount: string;
  }[];
}

export interface TransferFailureEvent extends TransferBaseEvent {
  errorCode: EventCode;
  fromAccountId: string;
  toAccountId: String;
}
