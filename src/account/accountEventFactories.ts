import { AccountUpdateInput } from "../account/account";
import { AuthInput } from "../auth/user";
import { Account } from "../generated/client";
import { EventCode } from "../types/eventCodes";
import { buildBaseEvent } from "../logging/baseEventFactories";
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
): AccountBaseEvent {
  return {
    ...buildBaseEvent(start, executionStatus),
    actorId: actorData.actorId,
    actorRole: actorData.role,
    customerId: actorData.customerId,
  }
}

export function buildSingleAccountSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  accountRecord: Account
): SingleAccountSuccessEvent {
  return {
    ...buildAccountBaseEvent(
      start, actorData, ExecutionStatus.SUCCESS
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
  accountRecords: Account[]
): ManyAccountSuccessEvent {
  return {
    ...buildAccountBaseEvent(
      start, actorData, ExecutionStatus.SUCCESS
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
  data?: AccountUpdateInput
): AccountFailureEvent {
  return {
    ...buildAccountBaseEvent(
      start, actorData, ExecutionStatus.FAILURE
    ),
    accountId,
    errorCode,
    ...(data?.nickname !== undefined && { nickname: data.nickname }),
    ...(data?.status !== undefined && { accountStatus: data.status }),
  };
}