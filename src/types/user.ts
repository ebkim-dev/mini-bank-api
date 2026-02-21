
import { UserRole } from "../generated/enums"


export type UserRegisterInput = {
  username: string;
  password: string;
};

export type UserLoginInput = {
  username: string;
  password: string;
};

export interface UserOutput {
  id: bigint;
  username: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface LoginOutput {
  token: string;
  user: UserOutput;
}