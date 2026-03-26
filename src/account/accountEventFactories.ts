import { AccountUpdateInput } from "../account/account";
import { AuthInput } from "../auth/user";
import { Account } from "../generated/client";
import { EventCode } from "../types/eventCodes";
import { buildBaseEvent } from "../logging/baseEventFactories";
import { Operation } from "../logging/operations";
import { 
  AccountBaseEvent,
  AccountFailureEvent,
  ExecutionStatus,
  ManyAccountSuccessEvent,
  SingleAccountSuccessEvent,
} from "../logging/logSchemas";


export function buildAccountBaseEvent(
  start: bigint,
  actorData: AuthInput,
  executionStatus: ExecutionStatus,
  operation: Operation,
): AccountBaseEvent {
  return {
    ...buildBaseEvent(start, executionStatus, operation),
    actorId: actorData.actorId,
    actorRole: actorData.role,
    customerId: actorData.customerId,
  }
}

export function buildSingleAccountSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  accountRecord: Account,
  operation: Operation,
): SingleAccountSuccessEvent {
  return {
    ...buildAccountBaseEvent(
      start, actorData, ExecutionStatus.SUCCESS, operation
    ),
    accountId: accountRecord.id,
    accountType: accountRecord.type,
    currency: accountRecord.currency,
    accountStatus: accountRecord.status,
  };
}

export function buildManyAccountSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  accountRecords: Account[],
  operation: Operation,
): ManyAccountSuccessEvent {
  return {
    ...buildAccountBaseEvent(
      start, actorData, ExecutionStatus.SUCCESS, operation
    ),
    accounts: accountRecords.map((accountRecord) => ({
      accountId: accountRecord.id,
      customerId: accountRecord.customer_id,
      accountType: accountRecord.type,
      currency: accountRecord.currency,
      accountStatus: accountRecord.status
    }))
  };
}

export function buildAccountFailureEvent(
  start: bigint,
  actorData: AuthInput,
  accountId: string,
  errorCode: EventCode,
  operation: Operation,
  data?: AccountUpdateInput,
): AccountFailureEvent {
  return {
    ...buildAccountBaseEvent(
      start, actorData, ExecutionStatus.FAILURE, operation
    ),
    accountId,
    errorCode,
    ...(data?.nickname !== undefined && { nickname: data.nickname }),
    ...(data?.status !== undefined && { accountStatus: data.status }),
  };
}