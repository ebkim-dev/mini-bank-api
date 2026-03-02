
import { UserRole } from "../generated/enums"

export interface JwtPayload {
  sub: string;
  role: UserRole;
};

export type RegisterInput = {
  username: string;
  password: string;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type RegisterOutput = {
  id: string;
};

export type LoginOutput = {
  sessionId: string;
};

export type AuthInput = {
  actorId: string;
  role: UserRole;
};