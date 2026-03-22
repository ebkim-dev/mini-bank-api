import { getDurationMs } from "../utils/calculateDuration";
import { BaseEvent, ExecutionStatus } from "./logSchemas";


export function buildBaseEvent(
  start: bigint,
  executionStatus: ExecutionStatus,
): BaseEvent {
  return {
    executionStatus,
    durationMs: getDurationMs(start),
  }
}