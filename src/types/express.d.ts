import { AuthInput } from "../auth/types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthInput;
      sessionId?: string;
    }
  }
}