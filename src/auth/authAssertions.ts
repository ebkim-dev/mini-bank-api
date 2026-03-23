import bcrypt from "bcrypt";
import { EventCode } from "../types/eventCodes";
import { ErrorMessages } from "../error/errorMessages";
import { UnauthorizedError } from "../error/error";
import { User } from "../generated/client";


export function throwIfUserNotFound(
  user: User | null
): asserts user is User {
  if (!user) {
    // Caller decides on statusCode
    throw new Error(EventCode.USER_NOT_FOUND);
  }
}

export async function throwIfInvalidPassword(
  user: User,
  password: string,
): Promise<void> {
  if (!(await bcrypt.compare(password, user.password_hash))) {
    throw UnauthorizedError(
      EventCode.INVALID_CREDENTIALS, 
      ErrorMessages.INVALID_CREDENTIALS,
    );
  }
}