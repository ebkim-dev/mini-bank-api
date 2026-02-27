
import { UserRole } from "../generated/enums"

export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}

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
  token: string;
  expiresIn: number;
}

export type AuthInput = {
  actorId: string;
  role: UserRole;
}