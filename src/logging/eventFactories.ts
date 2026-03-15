import { AccountUpdateInput } from "../account/account";
import { AuthInput } from "../auth/user";
import { Account, Transaction, Transfer } from "../generated/client";
import { TransferCreateInput } from "../generated/models";
import { EventCode } from "../types/eventCodes";
import { getDurationMs } from "../utils/calculateDuration";
import { 
  AccountFailureEvent,
  ExecutionStatus,
  ManyAccountSuccessEvent,
  SingleAccountSuccessEvent,
  ManyTransferSuccessEvent,
  TransactionFailureEvent,
  TransactionSuccessEvent,
  SingleTransferSuccessEvent,
  TransferFailureEvent
} from "./logSchemas";

export function buildSingleAccountSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  accountRecord: Account
): SingleAccountSuccessEvent {
  return {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs: getDurationMs(start),
    actorId: actorData.actorId,
    actorRole: actorData.role,
    accountId: accountRecord.id,
    customerId: accountRecord.customer_id,
    accountType: accountRecord.type,
    currency: accountRecord.currency,
    accountStatus: accountRecord.status,
  };
}

export function buildManyAccountSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  accountRecords: Account[]
): ManyAccountSuccessEvent {
  return {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs: getDurationMs(start),
    actorId: actorData.actorId,
    actorRole: actorData.role,
    customerId: actorData.customerId,
    accounts: accountRecords.map((accountRecord) => ({
      accountId: accountRecord.id,
      customerId: accountRecord.customer_id,
      accountType: accountRecord.type,
      currency: accountRecord.currency,
      accountStatus: accountRecord.status
    }))
  };
}

export function buildAccountFailEvent(
  start: bigint,
  authInput: AuthInput,
  accountId: string,
  errorCode: EventCode,
  data?: AccountUpdateInput
): AccountFailureEvent {
  return {
    executionStatus: ExecutionStatus.FAILURE,
    durationMs: getDurationMs(start),
    actorId: authInput.actorId,
    actorRole: authInput.role,
    customerId: authInput.customerId,
    accountId,
    errorCode,
    ...(data?.nickname !== undefined && { nickname: data.nickname }),
    ...(data?.status !== undefined && { accountStatus: data.status }),
  };
}


export function buildTransactionSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  transactionRecord: Transaction
): TransactionSuccessEvent {
  return {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs: getDurationMs(start),
    actorId: actorData.actorId,
    actorRole: actorData.role,
    customerId: actorData.customerId,
    transactionId: transactionRecord.id,
    accountId: transactionRecord.account_id,
    transactionType: transactionRecord.type,
    amount: transactionRecord.amount.toString(),
  };
}

export function buildManyTransactionSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  accountId: string,
  count: number
): TransactionSuccessEvent {
  return {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs: getDurationMs(start),
    actorId: actorData.actorId,
    customerId: actorData.customerId,
    actorRole: actorData.role,
    accountId,
    count,
  };
}

export function buildTransactionFailureEvent(
  start: bigint,
  actorData: AuthInput,
  errorCode: string,
  transactionId?: string,
  accountId?: string
): TransactionFailureEvent {
  return {
    executionStatus: ExecutionStatus.FAILURE,
    durationMs: getDurationMs(start),
    actorId: actorData.actorId,
    customerId:actorData.customerId,
    actorRole: actorData.role,
    errorCode,
    ...(transactionId && { transactionId }),
    ...(accountId && { accountId }),
  };
}

export function buildSingleTransferSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  transferRecord: Transfer
): SingleTransferSuccessEvent {
  return {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs: getDurationMs(start),
    actorId: actorData.actorId,
    actorRole: actorData.role,
    customerId: actorData.customerId,
    transferId: transferRecord.id,
    fromAccountId: transferRecord.from_account_id,
    toAccountId: transferRecord.to_account_id,
    amount: transferRecord.amount.toString(),
  };
}

export function buildManyTransferSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  transferRecords: Transfer[]
): ManyTransferSuccessEvent {
  return {
    executionStatus: ExecutionStatus.SUCCESS,
    durationMs: getDurationMs(start),
    actorId: actorData.actorId,
    actorRole: actorData.role,
    customerId: actorData.customerId,
    transfers: transferRecords.map((transferRecord) => ({
      transferId: transferRecord.id,
      fromAccountId: transferRecord.from_account_id,
      toAccountId: transferRecord.to_account_id,
      amount: transferRecord.amount.toString(),
    })),
  };
}

// export function buildTransferFailureEvent(
//   start: bigint,
//   actorData: AuthInput,
//   transferCreateInput: TransferCreateInput
// ): TransferFailureEvent {
//   return {
    
//   }
// }
