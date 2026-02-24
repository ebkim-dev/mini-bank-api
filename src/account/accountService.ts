import type {
  AccountCreateInput,
  AccountOutput,
  AccountUpdateInput,
} from './account';
import type { Account } from '../generated/client';
import prismaClient from '../db/prismaClient'
import { Prisma } from "../generated/client";
import { AccountStatus } from "../generated/enums";
import { NotFoundError } from "../error/error";
import { ErrorCode } from "../types/errorCodes";
import { serializeAccount } from './accountUtils';

export async function insertAccount(
  data: AccountCreateInput
): Promise<AccountOutput> {
  const accountRecord: Account = await prismaClient.account.create({
    data: {
      customer_id: data.customer_id,
      type: data.type,
      currency: data.currency,
      nickname: data.nickname ?? null,
      status: data.status ?? AccountStatus.ACTIVE,
      balance: data.balance ?? 0,
    },
  });

  return serializeAccount(accountRecord);
}

export async function fetchAccountsByCustomerId(
  customer_id: bigint
): Promise<AccountOutput[]> {
  const accountRecords: Account[] = 
    await prismaClient.account.findMany({ where: { customer_id } });

  return accountRecords.map((accountRecord) => serializeAccount(accountRecord));
}

export async function fetchAccountById(
  id: bigint
): Promise<AccountOutput> {
  const accountRecord: Account | null = 
    await prismaClient.account.findUnique({ where: { id } });

  if (!accountRecord) {
    throw NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found", { id });
  }

  return serializeAccount(accountRecord);
}

export async function updateAccountById(
  id: bigint, 
  data: AccountUpdateInput
): Promise<AccountOutput> {
  try {
    const accountRecord: Account = 
      await prismaClient.account.update({
        where: { id },
        data
      });

    return serializeAccount(accountRecord);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found", { id });
    }
    throw err;
  }
}

export async function deleteAccountById(
  id: bigint
): Promise<AccountOutput> {
  try {
    const accountRecord: Account = 
      await prismaClient.account.update({
        where: { id },
        data: { status: AccountStatus.CLOSED }
      });

    return serializeAccount(accountRecord);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found", { id });
    }
    throw err;
  }
}