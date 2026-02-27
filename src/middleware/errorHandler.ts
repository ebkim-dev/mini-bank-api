
import { NextFunction, Request, Response } from "express";
import { AppError, InternalServerError, NotFoundError } from "../error/error";
import { logger } from "../logging/logger";

export const notFoundHandler = (
  req: Request, 
  _res: Response, 
  next: NextFunction
): void => {
  const err = NotFoundError(
    "ROUTE_NOT_FOUND", 
    `Route ${req.method} ${req.originalUrl} not found`
  );
  next(err);
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
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

  logger.error(
    appError as any, 
    {
      traceId,
      method: req.method,
      path: req.originalUrl,
    }
  );

  const errorResponse = {
    traceId,
    code: appError.code,
    message: appError.message,
    ...(appError.details ? { details: appError.details } : {})
  };

  res.status(appError.statusCode).json(errorResponse);
};
