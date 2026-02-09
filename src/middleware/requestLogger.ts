// src/middleware/requestLogger.ts

import { NextFunction, Request, Response } from "express";
import { logInfo } from "../utils/logger";

/**
 * Logs basic information about every incoming HTTP request:
 *  - HTTP method
 *  - URL path
 *  - Response status code
 *  - Duration in milliseconds
 *  - traceId (if set by traceIdMiddleware)
 *
 * We attach the "finish" event on the response to log AFTER the response
 * has been sent and status code is known.
 */
export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = process.hrtime.bigint();

  // When response is finished, log details
  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000; // nanoseconds to ms

    const traceId = res.locals.traceId as string | undefined;

    logInfo("HTTP request completed", {
      traceId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: durationMs.toFixed(2)
    });
  });

  next();
};
