import { JwtPayloadType } from "../auth/types";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayloadType;
    }
  }
}

/*
import { AuthPayload } from "../middleware/requireAuth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}
*/