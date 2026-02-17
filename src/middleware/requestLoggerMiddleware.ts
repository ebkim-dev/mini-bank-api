import { NextFunction, Request, Response } from "express";
import { logger } from "../logging/logger";

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = process.hrtime.bigint();
  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

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
