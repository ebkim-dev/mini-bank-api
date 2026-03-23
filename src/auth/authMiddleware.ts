import { UnauthorizedError } from "../error/error";
import { EventCode } from "../types/eventCodes";
import { redisClient } from "../redis/redisClient";
import { AuthInput } from "./user";
import { decrypt } from "../utils/encryption";
import { logger } from "../logging/logger";
import {
  EXTENSION_THRESHOLD_SEC,
  EXTENSION_AMOUNT_SEC,
} from "./authService";
import z from "zod";
import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";

async function extendSessionIfExpiring(
  sessionId: string,
  ttl: number
): Promise<void> {
  
  if (ttl < 0) return;
  if (ttl > EXTENSION_THRESHOLD_SEC) return;

  try {
    await redisClient.expire(`session:${sessionId}`, EXTENSION_AMOUNT_SEC);
    logger.info(EventCode.SESSION_EXTENDED, {
      message: "Session TTL extended",
      sessionId,
      previousTtlSec: ttl,
      extendedBySec: EXTENSION_AMOUNT_SEC,
    });
  } catch (err) {
    logger.error(EventCode.SESSION_EXTEND_FAILED, {
      message: "Failed to extend session TTL",
      sessionId,
      previousTtlSec: ttl,
      err,
    });
  }
}

const authFailure = () =>
  UnauthorizedError(EventCode.INVALID_TOKEN, "Authentication failed");

export function requireAuth(): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const sessionHeader = req.headers["x-session-id"];
    const sessionId =
      Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader;

    if (!sessionId) return next(authFailure());

    const parsed = z.uuid().safeParse(sessionId);
    if (!parsed.success) return next(authFailure());

    try {
      const [raw, ttl] = await redisClient
        .multi()
        .get(`session:${sessionId}`)
        .ttl(`session:${sessionId}`)
        .exec() as unknown as [string | null, number];

      if (!raw) return next(authFailure());

      const session: AuthInput = JSON.parse(decrypt(raw));
      req.user = session;
      req.sessionId = sessionId;

      await extendSessionIfExpiring(sessionId, ttl);

      return next();
    } catch (err) {
      return next(authFailure());
    }
  };
};