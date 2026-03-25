import { EventCode } from "../types/eventCodes";
import { Operation } from "./operations";
import type {
  AccountStatus,
  AccountType,
  TransactionType,
  UserRole
} from "../generated/enums";

export enum ExecutionStatus {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE"
}

export interface BaseEvent {
  executionStatus: ExecutionStatus;
  durationMs: number;
  operation: Operation;
}

// ==== Auth (Success) ====

export interface AuthBaseSuccessEvent extends BaseEvent {
  actorId: string;
  actorRole: UserRole;
  customerId: string;
}

export interface RegisterSuccessEvent extends AuthBaseSuccessEvent {
  username: string;
}

export interface LoginSuccessEvent extends AuthBaseSuccessEvent {
  username: string;
}

export interface LogoutSuccessEvent extends AuthBaseSuccessEvent {}
 
export interface MeSuccessEvent extends AuthBaseSuccessEvent {}

// ==== Auth (Failure) ====

export interface AuthBaseFailureEvent extends BaseEvent {
  errorCode: EventCode;
}

export interface RegisterFailureEvent extends AuthBaseFailureEvent {
  username: string;
}

export interface LoginFailureEvent extends AuthBaseFailureEvent {
  username: string;
}

export interface MeFailureEvent extends AuthBaseFailureEvent {
  actorId: string;
  actorRole: UserRole;
  customerId: string;
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

// ==== Transaction ====

export interface TransactionSuccessEvent extends AccountBaseEvent {
  transactionId?: string;
  accountId: string;
  transactionType?: TransactionType;
  amount?: string;
  count?: number;
}

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
  toAccountId: string;
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
  fromAccountId?: string;
  toAccountId?: string;
  amount?: string;
}
