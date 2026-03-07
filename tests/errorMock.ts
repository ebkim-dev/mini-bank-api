
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export const CONFLICT_ERROR_MESSAGE = "Unique constraint failed";
export const NOT_FOUND_ERROR_MESSAGE = "Account not found";
export const UNKNOWN_ERROR_MESSAGE = "Unknown error";

export const CONFLICT_ERROR_CODE = "P2002";
export const NOT_FOUND_ERROR_CODE = "P2025";
export const UNKNOWN_ERROR_CODE = "P9999999";

export function buildPrismaError(
  errorMessage: string,
  errorCode: string
): PrismaClientKnownRequestError {
  return new PrismaClientKnownRequestError(
    errorMessage, 
    { code: errorCode, clientVersion: "test" }
  );
}