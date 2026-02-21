
import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UnauthorizedError } from "../error/error";
import { ErrorCode } from "../types/errorCodes";

export interface AuthPayload extends JwtPayload {
  userId: string;
  role: string;
}

export function requireAuth(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(
        UnauthorizedError(ErrorCode.INVALID_TOKEN, "Authentication failed")
      );
    }
    if (!authHeader.startsWith("Bearer ")) {
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
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as AuthPayload;

      req.user = {
        userId: decoded.userId,
        role: decoded.role,
      };

      return next();
    } catch (err) {
      return next(
        UnauthorizedError(ErrorCode.INVALID_TOKEN, "Authentication failed")
      );
    }
  };
};


/*

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

*/