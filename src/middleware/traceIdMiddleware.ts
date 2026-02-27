
import { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";

export const traceIdMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  const traceId =
    typeof randomUUID === "function"
      ? randomUUID()
      : `trace-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  res.locals.traceId = traceId;

  res.setHeader("X-Trace-Id", traceId);

  next();
};
