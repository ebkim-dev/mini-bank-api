import type {
  UserRegisterInput,
  UserLoginInput,
  UserOutput,
  LoginOutput,
} from '../types/user';
import { UserRole } from "../generated/enums"
import prismaClient from '../db/prismaClient'

import bcrypt from "bcrypt";

export async function registerUser(
  data: UserRegisterInput
): Promise<UserOutput> {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const userRecord = await prismaClient.user.create({ 
    data: {
      username: data.username,
      password_hash: hashedPassword,
      role: UserRole.STANDARD,
    }
   });

  const userOutput: UserOutput = {
    id: userRecord.id,
    username: userRecord.username,
    role: userRecord.role,
    created_at: userRecord.created_at,
    updated_at: userRecord.updated_at,
  }

  return userOutput;
}