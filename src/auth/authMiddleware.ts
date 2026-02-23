
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