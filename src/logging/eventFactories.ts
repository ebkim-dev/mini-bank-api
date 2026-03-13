import { AccountUpdateInput } from "../account/account";
import { AuthInput } from "../auth/user";
import { Account } from "../generated/client";
import { EventCode } from "../types/eventCodes";
import { getDurationMs } from "../utils/calculateDuration";
import { 
  AccountFailByAccountEvent,
  ExecutionStatus,
  ManyAccountSuccessEvent,
  SingleAccountSuccessEvent
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
): AccountFailByAccountEvent {
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