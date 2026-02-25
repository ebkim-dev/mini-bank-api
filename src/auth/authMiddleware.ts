
import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "../error/error";
import { ErrorCode } from "../types/errorCodes";
import { UserRole } from "../generated/enums";

export function requireAuth(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(
        UnauthorizedError(ErrorCode.INVALID_TOKEN, "Authentication failed")
      );
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(
        UnauthorizedError(ErrorCode.INVALID_TOKEN, "Authentication failed")
      );
    }

    try {
      // throws if jwt is expired
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      );

      req.user = decoded;

      return next();
    } catch (err) {
      return next(
        UnauthorizedError(ErrorCode.INVALID_TOKEN, "Authentication failed")
      );
    }
  };
};

export function requireRole(role: UserRole): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.user.role !== role) {
      return next(
        ForbiddenError(ErrorCode.FORBIDDEN, "Insufficient permissions")
      );
    }

    return next();
  };
};