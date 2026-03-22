import { AuthInput } from "../auth/user";
import { Transfer } from "../generated/client";
import { EventCode } from "../types/eventCodes";
import { Decimal } from "@prisma/client/runtime/client";
import { 
  ExecutionStatus,
  ManyTransferSuccessEvent,
  SingleTransferSuccessEvent,
  TransferBaseEvent,
  TransferFailureEvent
} from "../logging/logSchemas";
import { buildBaseEvent } from "../logging/baseEventFactories";


export function buildTransferBaseEvent(
  start: bigint,
  actorData: AuthInput,
  executionStatus: ExecutionStatus,
): TransferBaseEvent {
  return {
    ...buildBaseEvent(start, executionStatus),
    actorId: actorData.actorId,
    actorRole: actorData.role,
    customerId: actorData.customerId,
  }
}

export function buildSingleTransferSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  transferRecord: Transfer
): SingleTransferSuccessEvent {
  return {
    ...buildTransferBaseEvent(
      start, actorData, ExecutionStatus.SUCCESS
    ),
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
    ...buildTransferBaseEvent(
      start, actorData, ExecutionStatus.SUCCESS
    ),
    transfers: transferRecords.map((transferRecord) => ({
      transferId: transferRecord.id,
      fromAccountId: transferRecord.from_account_id,
      toAccountId: transferRecord.to_account_id,
      amount: transferRecord.amount.toString(),
    })),
  };
}

export function buildTransferFailureEvent(
  start: bigint,
  actorData: AuthInput,
  errorCode: EventCode,
  fromAccountId: string,
  toAccountId?: string,
  amount?: Decimal,
): TransferFailureEvent {
  return {
    ...buildTransferBaseEvent(
      start, actorData, ExecutionStatus.FAILURE
    ),
    errorCode,
    fromAccountId,
    ...(toAccountId !== undefined && { toAccountId }),
    ...(amount !== undefined && { amount: amount.toString() }),
  }
}
