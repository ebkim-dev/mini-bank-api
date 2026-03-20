import { UserRole } from "../generated/enums"

export type RegisterInput = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
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
  customerId: string;
};

export type MeOutput = {
  id: string;
  username: string;
  role: UserRole;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
};