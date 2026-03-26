import { AuthInput } from "../auth/user";
import { Transaction } from "../generated/client";
import { buildBaseEvent } from "../logging/baseEventFactories";
import { Operation } from "../logging/operations";
import { 
  ExecutionStatus,
  TransactionFailureEvent,
  TransactionSuccessEvent,
} from "../logging/logSchemas";


export function buildTransactionSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  transactionRecord: Transaction,
  operation: Operation,
): TransactionSuccessEvent {
  return {
    ...buildBaseEvent(
      start, ExecutionStatus.SUCCESS, operation
    ),
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
  count: number,
  operation: Operation,
): TransactionSuccessEvent {
  return {
    ...buildBaseEvent(
      start, ExecutionStatus.SUCCESS, operation
    ),
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
  operation: Operation,
  transactionId?: string,
  accountId?: string
): TransactionFailureEvent {
  return {
    ...buildBaseEvent(
      start, ExecutionStatus.FAILURE, operation
    ),
    actorId: actorData.actorId,
    customerId: actorData.customerId,
    actorRole: actorData.role,
    errorCode,
    ...(transactionId && { transactionId }),
    ...(accountId && { accountId }),
  };
}