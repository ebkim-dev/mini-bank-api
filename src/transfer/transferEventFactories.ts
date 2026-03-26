import { AuthInput } from "../auth/user";
import { Transfer } from "../generated/client";
import { EventCode } from "../types/eventCodes";
import { Decimal } from "@prisma/client/runtime/client";
import { buildBaseEvent } from "../logging/baseEventFactories";
import { Operation } from "../logging/operations";
import { 
  ExecutionStatus,
  ManyTransferSuccessEvent,
  SingleTransferSuccessEvent,
  TransferBaseEvent,
  TransferFailureEvent
} from "../logging/logSchemas";


export function buildTransferBaseEvent(
  start: bigint,
  actorData: AuthInput,
  executionStatus: ExecutionStatus,
  operation: Operation,
): TransferBaseEvent {
  return {
    ...buildBaseEvent(
      start, executionStatus, operation
    ),
    actorId: actorData.actorId,
    actorRole: actorData.role,
    customerId: actorData.customerId,
  }
}

export function buildSingleTransferSuccessEvent(
  start: bigint,
  actorData: AuthInput,
  transferRecord: Transfer,
  operation: Operation,
): SingleTransferSuccessEvent {
  return {
    ...buildTransferBaseEvent(
      start, actorData, ExecutionStatus.SUCCESS, operation
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
  transferRecords: Transfer[],
  operation: Operation,
): ManyTransferSuccessEvent {
  return {
    ...buildTransferBaseEvent(
      start, actorData, ExecutionStatus.SUCCESS, operation
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
  operation: Operation,
  fromAccountId?: string,
  toAccountId?: string,
  amount?: Decimal,
): TransferFailureEvent {
  return {
    ...buildTransferBaseEvent(
      start, actorData, ExecutionStatus.FAILURE, operation
    ),
    errorCode,
    ...(fromAccountId !== undefined && { fromAccountId }),
    ...(toAccountId !== undefined && { toAccountId }),
    ...(amount !== undefined && { amount: amount.toString() }),
  }
}
