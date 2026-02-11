import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodError, ZodSchema } from "zod";
import { BadRequestError } from "../utils/error";
import { ErrorCode } from "../types/errorCodes";

function formatZodIssues(err: ZodError) {
  return err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
    code: i.code,
  }));
}

export function validate(
  schema: ZodSchema<any>,
  source: "body" | "query" | "params"
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);

      
      (req as any).validated = (req as any).validated || {};
      (req as any).validated[source] = parsed;

      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          BadRequestError(ErrorCode.VALIDATION_ERROR, "Validation failed", {
            issues: formatZodIssues(err),
          })
        );
      }
      return next(err);
    }
  };
}
