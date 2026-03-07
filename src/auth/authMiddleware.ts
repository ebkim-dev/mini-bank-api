
import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "../error/error";
import { EventCode } from "../types/eventCodes";
import { UserRole } from "../generated/enums";
import { redisClient } from "../redis/redisClient";
import z from "zod";

export function requireAuth(): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const sessionHeader = req.headers["x-session-id"];
    const sessionId = 
      Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader;
    if (!sessionId) {
      return next(
        UnauthorizedError(EventCode.INVALID_TOKEN, "Authentication failed")
      );
    }

    const parsed = z.uuid().safeParse(sessionId);
    if (!parsed.success) {
      return next(
        UnauthorizedError(EventCode.INVALID_TOKEN, "Authentication failed")
      );
    }

    try {
      const token = await redisClient.get(`session:${sessionId}`);
      if (!token) {
        return next(
          UnauthorizedError(EventCode.INVALID_TOKEN, "Authentication failed")
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      );

      req.user = decoded;

      return next();
    } catch (err) {
      return next(
        UnauthorizedError(EventCode.INVALID_TOKEN, "Authentication failed")
      );
    }
  };
};

export function requireRole(role: UserRole): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.user.role !== role) {
      return next(
        ForbiddenError(EventCode.FORBIDDEN, "Insufficient permissions")
      );
    }

    return next();
  };
};