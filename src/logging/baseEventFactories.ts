import { getDurationMs } from "../utils/calculateDuration";
import { BaseEvent, ExecutionStatus } from "./logSchemas";
import { Operation } from "./operations";


export function buildBaseEvent(
  start: bigint,
  executionStatus: ExecutionStatus,
  operation: Operation,
): BaseEvent {
  return {
    executionStatus,
    durationMs: getDurationMs(start),
    operation,
  }
}