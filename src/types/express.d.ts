import { JwtPayloadType } from "../auth/types";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayloadType;
    }
  }
}