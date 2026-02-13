
import { NextFunction, Request, Response } from "express";
import { AppError, InternalServerError, NotFoundError } from "../utils/error";
import { logError } from "../utils/logger";

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const err = NotFoundError("ROUTE_NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`);
  next(err);
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const traceId = res.locals.traceId as string | undefined;

  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else {
    appError = InternalServerError("Unexpected error occurred", {
      originalError: (err as Error)?.message ?? err
    });
  }

  logError(appError.message, {
    traceId,
    code: appError.code,
    statusCode: appError.statusCode,
    path: req.originalUrl,
    method: req.method
  });

  const errorResponse = {
    traceId,
    code: appError.code,
    message: appError.message,
    ...(appError.details ? { details: appError.details } : {})
  };

  res.status(appError.statusCode).json(errorResponse);
};
