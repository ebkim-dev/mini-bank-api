// src/middleware/traceId.ts

import { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";

/**
 * Generates a unique ID for each incoming HTTP request and attaches it to:
 *  - res.locals.traceId      -> useful inside controllers / services
 *  - "X-Trace-Id" header     -> useful for clients / debugging
 *
 * This helps us correlate log entries and error responses for a single request.
 */
export const traceIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Use crypto.randomUUID if available (Node 16.14+ / 18+)
  // Fallback to a simple random string if needed.
  const traceId =
    typeof randomUUID === "function"
      ? randomUUID()
      : `trace-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // Attach to response locals (typed as any, so no extra TS config needed)
  res.locals.traceId = traceId;

  // Expose trace ID to the client as a header for easier debugging
  res.setHeader("X-Trace-Id", traceId);

  next();
};
