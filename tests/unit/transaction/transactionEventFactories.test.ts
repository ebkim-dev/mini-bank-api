import { ExecutionStatus } from "../../../src/logging/logSchemas";
import { buildAuthInput } from "../../authMock";
import { EventCode } from "../../../src/types/eventCodes";
import { buildTransactionRecord } from "../../transactionMock";
import { Operation } from "../../../src/logging/operations";
import {
  mockAccountId1,
  mockTransactionId1,
} from "../../commonMock";
import {
  buildManyTransactionSuccessEvent,
  buildTransactionFailureEvent,
  buildTransactionSuccessEvent
} from "../../../src/transaction/transactionEventFactories";

describe("buildTransactionSuccessEvent", () => {
  it("should return a valid TransactionSuccessEvent", () => {
    const start = process.hrtime.bigint();
    const actorData = buildAuthInput();
    const transactionRecord = buildTransactionRecord();
    const event = buildTransactionSuccessEvent(
      start, actorData, transactionRecord, Operation.TRANSACTION_CREATE
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
    expect(event.actorId).toBe(actorData.actorId);
    expect(event.actorRole).toBe(actorData.role);
    expect(event.customerId).toBe(actorData.customerId);
    expect(event.transactionId).toBe(transactionRecord.id);
    expect(event.accountId).toBe(transactionRecord.account_id);
    expect(event.transactionType).toBe(transactionRecord.type);
    expect(event.amount).toBe(transactionRecord.amount.toString());
  });
});

describe("buildManyTransactionSuccessEvent", () => {
  it("should return a valid TransactionSuccessEvent with count", () => {
    const start = process.hrtime.bigint();
    const actorData = buildAuthInput();
    const event = buildManyTransactionSuccessEvent(
      start, actorData, mockAccountId1, 2, Operation.TRANSACTION_LIST
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
    expect(event.actorId).toBe(actorData.actorId);
    expect(event.customerId).toBe(actorData.customerId);
    expect(event.actorRole).toBe(actorData.role);
    expect(event.accountId).toBe(mockAccountId1);
    expect(event.count).toBe(2);
  });
});

describe("buildTransactionFailureEvent", () => {
  it("should return a valid TransactionFailureEvent without optional parameters", () => {
    const start = process.hrtime.bigint();
    const actorData = buildAuthInput();
    const event = buildTransactionFailureEvent(
      start,
      actorData,
      EventCode.TRANSACTION_NOT_FOUND,
      Operation.TRANSACTION_CREATE,
    );

    expect(event.executionStatus).toBe(ExecutionStatus.FAILURE);
    expect(event.actorId).toBe(actorData.actorId);
    expect(event.customerId).toBe(actorData.customerId);
    expect(event.actorRole).toBe(actorData.role);
    expect(event.errorCode).toBe(EventCode.TRANSACTION_NOT_FOUND);
    expect(event.transactionId).toBeUndefined();
    expect(event.accountId).toBeUndefined();
  });

  it("should return a valid AccountFailEvent given optional parameters", () => {
    const start = process.hrtime.bigint();
    const actorData = buildAuthInput();
    const event = buildTransactionFailureEvent(
      start,
      actorData,
      EventCode.TRANSACTION_NOT_FOUND,
      Operation.TRANSACTION_CREATE,
      mockTransactionId1,
      mockAccountId1
    );

    expect(event.executionStatus).toBe(ExecutionStatus.FAILURE);
    expect(event.actorId).toBe(actorData.actorId);
    expect(event.customerId).toBe(actorData.customerId);
    expect(event.actorRole).toBe(actorData.role);
    expect(event.errorCode).toBe(EventCode.TRANSACTION_NOT_FOUND);
    expect(event.transactionId).toBe(mockTransactionId1);
    expect(event.accountId).toBe(mockAccountId1);
  });
});
