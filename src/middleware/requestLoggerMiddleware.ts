import { NextFunction, Request, Response } from "express";
import { logger } from "../logging/logger";
import { getDurationMs } from "../utils/calculateDuration";

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = getDurationMs(startTime);
    const traceId = res.locals.traceId as string | undefined;

    logger.info("HTTP request completed", {
      traceId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: durationMs.toFixed(2)
    });
  });

  next();
};
