import { AccountStatus, UserRole } from "../../../src/generated/client";
import { ExecutionStatus } from "../../../src/logging/logSchemas";
import { buildAccountRecord } from "../../accountMock";
import { buildAuthInput } from "../../authMock";
import { EventCode } from "../../../src/types/eventCodes";
import { Operation } from "../../../src/logging/operations";
import {
  buildAccountBaseEvent,
  buildAccountFailureEvent,
  buildManyAccountSuccessEvent,
  buildSingleAccountSuccessEvent
} from "../../../src/account/accountEventFactories";
import {
  mockAccountId1,
  mockAccountId2,
} from "../../commonMock";

describe("buildAccountBaseEvent", () => {
  it("should return a SUCCESS AccountBaseEvent given SUCCESS executionStatus", () => {
    const start = process.hrtime.bigint();
    const actorData = buildAuthInput();
    const event = buildAccountBaseEvent(
      start, buildAuthInput(), ExecutionStatus.SUCCESS, Operation.ACCOUNT_CREATE
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
    expect(event.actorId).toBe(actorData.actorId);
    expect(event.actorRole).toBe(actorData.role);
    expect(event.customerId).toBe(actorData.customerId);
  });

  it("should return a FAILURE AccountBaseEvent given FAILURE executionStatus", () => {
    const start = process.hrtime.bigint();
    const actorData = buildAuthInput();
    const event = buildAccountBaseEvent(
      start, buildAuthInput(), ExecutionStatus.FAILURE, Operation.ACCOUNT_CREATE
    );

    expect(event.executionStatus).toBe(ExecutionStatus.FAILURE);
    expect(event.actorId).toBe(actorData.actorId);
    expect(event.actorRole).toBe(actorData.role);
    expect(event.customerId).toBe(actorData.customerId);
  });
});

describe("buildSingleAccountSuccessEvent", () => {
  it("should return a valid SingleAccountSuccessEvent", () => {
    const start = process.hrtime.bigint();
    const accountRecord = buildAccountRecord();
    const event = buildSingleAccountSuccessEvent(
      start, buildAuthInput(), accountRecord, Operation.ACCOUNT_GET
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
    expect(event.accountId).toBe(accountRecord.id);
    expect(event.accountType).toBe(accountRecord.type);
    expect(event.currency).toBe(accountRecord.currency);
    expect(event.accountStatus).toBe(accountRecord.status);
  });
});

describe("buildManyAccountSuccessEvent", () => {
  it("should return a valid ManyAccountSuccessEvent", () => {
    const start = process.hrtime.bigint();
    const accountRecord1 = buildAccountRecord();
    const accountRecord2 = buildAccountRecord({
      id: mockAccountId2
    });
    const accountRecords = [accountRecord1, accountRecord2];
    const event = buildManyAccountSuccessEvent(
      start, buildAuthInput(), accountRecords, Operation.ACCOUNT_LIST
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
    expect(event.accounts).toHaveLength(2);
    expect(event.accounts[0]!.accountId).toBe(mockAccountId1);
    expect(event.accounts[1]!.accountId).toBe(mockAccountId2);
  });
});

describe("buildAccountFailureEvent", () => {
  it("should return a valid AccountFailureEvent given empty AccountUpdateInput", () => {
    const start = process.hrtime.bigint();
    const event = buildAccountFailureEvent(
      start,
      buildAuthInput(),
      mockAccountId1,
      EventCode.ACCOUNT_NOT_FOUND,
      Operation.ACCOUNT_CREATE
    );

    expect(event.executionStatus).toBe(ExecutionStatus.FAILURE);
    expect(event.accountId).toBe(mockAccountId1);
    expect(event.errorCode).toBe(EventCode.ACCOUNT_NOT_FOUND);
    expect(event.nickname).toBeUndefined();
    expect(event.accountStatus).toBeUndefined();
  });

  it("should return a valid AccountFailureEvent given populated AccountUpdateInput", () => {
    const start = process.hrtime.bigint();
    const event = buildAccountFailureEvent(
      start,
      buildAuthInput(),
      mockAccountId1,
      EventCode.ACCOUNT_NOT_FOUND,
      Operation.ACCOUNT_UPDATE,
      { nickname: "alice", status: AccountStatus.ACTIVE }
    );

    expect(event.executionStatus).toBe(ExecutionStatus.FAILURE);
    expect(event.accountId).toBe(mockAccountId1);
    expect(event.errorCode).toBe(EventCode.ACCOUNT_NOT_FOUND);
    expect(event.nickname).toBe("alice");
    expect(event.accountStatus).toBe(AccountStatus.ACTIVE);
  });
});
