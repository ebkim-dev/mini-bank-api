import type {
  AccountCreateInput,
  AccountUpdateInput,
} from '../types/account';
import type { Account } from '../generated/client';
import prismaClient from '../db/prismaClient'
import { Prisma } from "../generated/client";
import { AccountStatus } from '../types/account';
import { NotFoundError } from "../error/error";
import { ErrorCode } from "../types/errorCodes";

export async function insertAccount(
  data: AccountCreateInput
): Promise<Account> {
  return await prismaClient.account.create({ data });
}

export async function fetchAccountsByCustomerId(
  customer_id: bigint
): Promise<Account[]> {
  return await prismaClient.account.findMany({ where: { customer_id } });
}

export async function fetchAccountById(
  id: bigint
): Promise<Account> {
  const account = await prismaClient.account.findUnique({ where: { id } });
  if (!account) {
    throw NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found", { id });
  }
  return account;
}

export async function updateAccountById(
  id: bigint, 
  data: AccountUpdateInput
): Promise<Account> {
  try {
    return await prismaClient.account.update({
      where: { id },
      data
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found", { id });
    }
    throw err;
  }
}

export async function deleteAccountById(
  id: bigint
): Promise<Account> {
  try {
    return await prismaClient.account.update({
      where: { id },
      data: { status: AccountStatus.CLOSED }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found", { id });
    }
    throw err;
  }
}