import { buildBaseEvent } from "../../../src/logging/baseEventFactories";
import { ExecutionStatus } from "../../../src/logging/logSchemas";
import { Operation } from "../../../src/logging/operations";

describe("buildBaseEvent", () => {
  it("should return a SUCCESS BaseEvent with correct duration", () => {
    const start = process.hrtime.bigint();
    const event = buildBaseEvent(
      start, ExecutionStatus.SUCCESS, Operation.ACCOUNT_CREATE
    );

    expect(event.executionStatus).toBe(ExecutionStatus.SUCCESS);
    expect(typeof event.durationMs).toBe("number");
    expect(event.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should return a FAILURE BaseEvent with correct duration", () => {
    const start = process.hrtime.bigint();
    const event = buildBaseEvent(
      start, ExecutionStatus.FAILURE, Operation.ACCOUNT_CREATE
    );

    expect(event.executionStatus).toBe(ExecutionStatus.FAILURE);
    expect(typeof event.durationMs).toBe("number");
    expect(event.durationMs).toBeGreaterThanOrEqual(0);
  });
});