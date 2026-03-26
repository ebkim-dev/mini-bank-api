import { AccountStatus, UserRole } from "../../../src/generated/client";
import { ExecutionStatus } from "../../../src/logging/logSchemas";
import { buildAccountRecord } from "../../accountMock";
import { buildAuthInput } from "../../authMock";
import {
  buildAccountBaseEvent,
  buildAccountFailureEvent,
  buildManyAccountSuccessEvent,
  buildSingleAccountSuccessEvent
} from "../../../src/account/accountEventFactories";
import {
  mockAccountId1,
  mockAccountId2,
  mockCustomerId1,
  mockTransferId1,
  mockTransferId2,
  mockUserId
} from "../../commonMock";
import { EventCode } from "../../../src/types/eventCodes";
import { 
  buildManyTransferSuccessEvent,
  buildSingleTransferSuccessEvent,
  buildTransferBaseEvent,
  buildTransferFailureEvent
} from "../../../src/transfer/transferEventFactories";
import { buildTransferRecord } from "../../transferMock";
import { Decimal } from "@prisma/client/runtime/client";
import { Operation } from "../../../src/logging/operations";

describe("buildTransferBaseEvent", () => {
  it("should return a SUCCESS TransferBaseEvent given SUCCESS executionStatus", () => {
    const start = process.hrtime.bigint();
    const actorData = buildAuthInput();
    const event = buildTransferBaseEvent(
      start, actorData, ExecutionStatus.SUCCESS, Operation.TRANSFER_CREATE
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
    expect(event.actorId).toBe(actorData.actorId);
    expect(event.actorRole).toBe(actorData.role);
    expect(event.customerId).toBe(actorData.customerId);
  });

  it("should return a FAILURE TransferBaseEvent given FAILURE executionStatus", () => {
    const start = process.hrtime.bigint();
    const actorData = buildAuthInput();
    const event = buildTransferBaseEvent(
      start, actorData, ExecutionStatus.FAILURE, Operation.TRANSFER_CREATE
    );

    expect(event.executionStatus).toBe(ExecutionStatus.FAILURE);
    expect(event.actorId).toBe(actorData.actorId);
    expect(event.actorRole).toBe(actorData.role);
    expect(event.customerId).toBe(actorData.customerId);
  });
});

describe("buildSingleTransferSuccessEvent", () => {
  it("should return a valid SingleTransferSuccessEvent", () => {
    const start = process.hrtime.bigint();
    const transferRecord = buildTransferRecord();
    const event = buildSingleTransferSuccessEvent(
      start, buildAuthInput(), transferRecord, Operation.TRANSFER_GET
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
    expect(event.transferId).toBe(transferRecord.id);
    expect(event.fromAccountId).toBe(transferRecord.from_account_id);
    expect(event.toAccountId).toBe(transferRecord.to_account_id);
    expect(event.amount).toBe(transferRecord.amount.toString());
  });
});

describe("buildManyTransferSuccessEvent", () => {
  it("should return a valid ManyTransferSuccessEvent", () => {
    const start = process.hrtime.bigint();
    const transferRecord1 = buildTransferRecord();
    const transferRecord2 = buildTransferRecord({
      id: mockTransferId2
    });
    const transferRecords = [transferRecord1, transferRecord2];
    const event = buildManyTransferSuccessEvent(
      start, buildAuthInput(), transferRecords, Operation.TRANSFER_LIST
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
    expect(event.transfers).toHaveLength(2);
    expect(event.transfers[0]!.transferId).toBe(mockTransferId1);
    expect(event.transfers[1]!.transferId).toBe(mockTransferId2);
  });
});

describe("buildTransferFailureEvent", () => {
  it("should return a valid TransferFailureEvent without optional parameters", () => {
    const start = process.hrtime.bigint();
    const event = buildTransferFailureEvent(
      start,
      buildAuthInput(),
      EventCode.TRANSFER_NOT_FOUND,
      Operation.TRANSFER_CREATE,
      mockAccountId1,
    );

    expect(event.executionStatus).toBe(ExecutionStatus.FAILURE);
    expect(event.errorCode).toBe(EventCode.TRANSFER_NOT_FOUND);
    expect(event.fromAccountId).toBe(mockAccountId1);
    expect(event.toAccountId).toBeUndefined();
    expect(event.amount).toBeUndefined();
  });

  it("should return a valid TransferFailureEvent given optional parameters", () => {
    const start = process.hrtime.bigint();
    const event = buildTransferFailureEvent(
      start,
      buildAuthInput(),
      EventCode.TRANSFER_NOT_FOUND,
      Operation.TRANSFER_CREATE,
      mockAccountId1,
      mockAccountId2,
      new Decimal("42.00")
    );

    expect(event.executionStatus).toBe(ExecutionStatus.FAILURE);
    expect(event.errorCode).toBe(EventCode.TRANSFER_NOT_FOUND);
    expect(event.fromAccountId).toBe(mockAccountId1);
    expect(event.toAccountId).toBe(mockAccountId2);
    expect(event.amount!.toString()).toBe("42");
  });
});
