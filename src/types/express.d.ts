import { AuthInput } from "../auth/user";

declare global {
  namespace Express {
    interface Request {
      user?: AuthInput;
      sessionId?: string;
    }
  }
}