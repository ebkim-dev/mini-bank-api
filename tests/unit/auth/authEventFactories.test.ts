import { UserRole } from "../../../src/generated/client";
import { ExecutionStatus } from "../../../src/logging/logSchemas";
import { EventCode } from "../../../src/types/eventCodes";
import { buildAuthInput, buildUserRecord } from "../../authMock";
import { Operation } from "../../../src/logging/operations";
import {
  mockCustomerId1,
  mockUserId
} from "../../commonMock";
import {
  buildAuthBaseFailureEvent,
  buildAuthBaseSuccessEvent,
  buildLoginFailureEvent,
  buildLoginSuccessEvent,
  buildLogoutSuccessEvent,
  buildMeFailureEvent,
  buildMeSuccessEvent,
  buildRegisterFailureEvent,
  buildRegisterSuccessEvent
} from "../../../src/auth/authEventFactories";


// ==== SUCCESS ====

describe("buildAuthBaseSuccessEvent", () => {
  it("should return a valid AuthBaseSuccessEvent", () => {
    const start = process.hrtime.bigint();
    const event = buildAuthBaseSuccessEvent(
      start,
      mockUserId,
      UserRole.STANDARD,
      mockCustomerId1,
      Operation.AUTH_REGISTER,
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
    expect(event.actorId).toBe(mockUserId);
    expect(event.actorRole).toBe(UserRole.STANDARD);
    expect(event.customerId).toBe(mockCustomerId1);
  });
});

describe("buildRegisterSuccessEvent", () => {
  it("should return a valid RegisterSuccessEvent", () => {
    const start = process.hrtime.bigint();
    const userRecord = buildUserRecord();
    const event = buildRegisterSuccessEvent(
      start, userRecord, Operation.AUTH_REGISTER
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
    expect(event.username).toBe(userRecord.username);
  });
});

describe("buildLoginSuccessEvent", () => {
  it("should return a valid LoginSuccessEvent", () => {
    const start = process.hrtime.bigint();
    const userRecord = buildUserRecord();
    const event = buildLoginSuccessEvent(
      start, userRecord, Operation.AUTH_LOGIN
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
    expect(event.username).toBe(userRecord.username);
  });
});

describe("buildLogoutSuccessEvent", () => {
  it("should return a valid LogoutSuccessEvent", () => {
    const start = process.hrtime.bigint();
    const event = buildLogoutSuccessEvent(
      start, buildAuthInput(), Operation.AUTH_LOGOUT
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
  });
});

describe("buildMeSuccessEvent", () => {
  it("should return a valid MeSuccessEvent", () => {
    const start = process.hrtime.bigint();
    const event = buildMeSuccessEvent(
      start, buildAuthInput(), Operation.AUTH_ME
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
  });
});

// ==== FAILURE ====

describe("buildAuthBaseFailureEvent", () => {
  it("should return a valid AuthBaseFailureEvent", () => {
    const start = process.hrtime.bigint();
    const event = buildAuthBaseFailureEvent(
      start, EventCode.INVALID_CREDENTIALS, Operation.AUTH_REGISTER
    );

    expect(event.executionStatus).toBe(ExecutionStatus.FAILURE);
    expect(event.errorCode).toBe(EventCode.INVALID_CREDENTIALS);
  });
});

describe("buildRegisterFailureEvent", () => {
  it("should return a valid RegisterFailureEvent", () => {
    const start = process.hrtime.bigint();
    const event = buildRegisterFailureEvent(
      start, "alice123", EventCode.USERNAME_ALREADY_EXISTS, Operation.AUTH_REGISTER
    );

    expect(event.executionStatus).toBe(ExecutionStatus.FAILURE);
    expect(event.username).toBe("alice123");
    expect(event.errorCode).toBe(EventCode.USERNAME_ALREADY_EXISTS);
  });
});

describe("buildLoginFailureEvent", () => {
  it("should return a valid LoginFailureEvent", () => {
    const start = process.hrtime.bigint();
    const event = buildLoginFailureEvent(
      start, "alice123", EventCode.INVALID_CREDENTIALS, Operation.AUTH_LOGIN
    );

    expect(event.executionStatus).toBe(ExecutionStatus.FAILURE);
    expect(event.username).toBe("alice123");
    expect(event.errorCode).toBe(EventCode.INVALID_CREDENTIALS);
  });
});

describe("buildMeFailureEvent", () => {
  it("should return a valid MeFailureEvent", () => {
    const start = process.hrtime.bigint();
    const event = buildMeFailureEvent(
      start, buildAuthInput(), EventCode.USER_NOT_FOUND, Operation.AUTH_ME
    );

    expect(event.executionStatus).toBe(ExecutionStatus.FAILURE);
    expect(event.actorId).toBe(mockUserId);
    expect(event.actorRole).toBe(UserRole.STANDARD);
    expect(event.customerId).toBe(mockCustomerId1);
    expect(event.errorCode).toBe(EventCode.USER_NOT_FOUND);
  });
});
