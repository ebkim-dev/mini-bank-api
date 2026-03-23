import { AuthInput } from "../auth/user";
import { Transaction } from "../generated/client";
import { 
  ExecutionStatus,
  TransactionFailureEvent,
  TransactionSuccessEvent,
} from "../logging/logSchemas";
import { buildBaseEvent } from "../logging/baseEventFactories";


export function buildTransactionSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  transactionRecord: Transaction
): TransactionSuccessEvent {
  return {
    ...buildBaseEvent(start, ExecutionStatus.SUCCESS),
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
    ...buildBaseEvent(start, ExecutionStatus.SUCCESS),
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
    ...buildBaseEvent(start, ExecutionStatus.FAILURE),
    actorId: actorData.actorId,
    customerId: actorData.customerId,
    actorRole: actorData.role,
    errorCode,
    ...(transactionId && { transactionId }),
    ...(accountId && { accountId }),
  };
}