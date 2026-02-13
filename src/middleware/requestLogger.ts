import { NextFunction, Request, Response } from "express";
import { logInfo } from "../utils/logger";

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
