// src/middleware/errorHandler.ts

import { NextFunction, Request, Response } from "express";
import { AppError, InternalServerError, NotFoundError } from "../utils/error";
import { logError } from "../utils/logger";

/**
 * 404 handler for unmatched routes.
 * This should be registered AFTER all normal routes.
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const err = NotFoundError("ROUTE_NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`);
  next(err);
};

/**
 * Global error-handling middleware.
 * This must have 4 parameters (err, req, res, next) for Express to recognize it.
 *
 * Responsibilities:
 *  - Normalize any thrown error into an AppError
 *  - Log the error with traceId and useful context
 *  - Send a consistent JSON error response to the client
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
): void => {
  const traceId = res.locals.traceId as string | undefined;

  let appError: AppError;

  if (err instanceof AppError) {
    // Error already in our normalized format
    appError = err;
  } else {
    // Wrap unknown errors into a generic internal error
    appError = InternalServerError("Unexpected error occurred", {
      originalError: (err as Error)?.message ?? err
    });
  }

  // Log the error with context
  logError(appError.message, {
    traceId,
    code: appError.code,
    statusCode: appError.statusCode,
    path: req.originalUrl,
    method: req.method
  });

  // Build JSON response payload
  const errorResponse = {
    traceId,
    code: appError.code,
    message: appError.message,
    // Only include details if present (optional)
    ...(appError.details ? { details: appError.details } : {})
  };

  res.status(appError.statusCode).json(errorResponse);
};
