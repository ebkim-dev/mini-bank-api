import { ForbiddenError, UnauthorizedError } from "../error/error";
import { EventCode } from "../types/eventCodes";
import { UserRole } from "../generated/enums";
import { redisClient } from "../redis/redisClient";
import { AuthInput } from "./user";
import z from "zod";
import type { 
  Request,
  Response,
  NextFunction,
  RequestHandler
 } from "express";
import { decrypt } from "../utils/encryption";

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
      const raw = await redisClient.get(`session:${sessionId}`);
      if (!raw) {
        return next(
          UnauthorizedError(EventCode.INVALID_TOKEN, "Authentication failed")
        );
      }
      const session: AuthInput = JSON.parse(decrypt(raw));
      req.user = session;

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
    if (!req.user || req.user.role !== role) {
      return next(
        ForbiddenError(EventCode.FORBIDDEN, "Insufficient permissions")
      );
    }

    return next();
  };
};