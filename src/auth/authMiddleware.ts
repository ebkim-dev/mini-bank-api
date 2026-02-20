
import type { Request, Response, NextFunction, RequestHandler } from "express";

import * as jwt from "jsonwebtoken"
import { UnauthorizedError } from "../error/error";
import { ErrorCode } from "../types/errorCodes";

export const requireAuth(): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header) {
      return next(new Error("Unauthorized"));
    }

    const token = header.split(" ")[1];

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  }
};

export const requireAuth(): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(
        UnauthorizedError(ErrorCode.UNAUTHORIZED, "Validation failed", {
          issues: formatZodIssues(err),
        })
      );
    }

    const token = authHeader.split(" ")[1];
  }
};