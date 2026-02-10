import type {
    AccountCreateInput,
    AccountUpdateInput,
} from '../types/account';

import type { Account } from '../generated/client';

import prisma from '../db/prismaClient'
import { AccountStatus } from '../types/account';

export async function insertAccount(data: AccountCreateInput): Promise<Account> {
  return await prisma.account.create({
    data: {
        customer_id: BigInt(data.customer_id),
        type: data.type,
        currency: data.currency,
        nickname: data.nickname ?? null,
        status: data.status ?? AccountStatus.ACTIVE,
        balance: data.balance ?? 0.0,
    },
  });
}

export async function fetchAccountsByCustomerId(customer_id: bigint): Promise<Account[]> {
    return await prisma.account.findMany({
        where: {
            customer_id: customer_id, 
        },
    });
}

export async function fetchAccountById(id: bigint): Promise<Account | null> {
    return await prisma.account.findUnique({ 
        where: { id },
    });
}

export async function updateAccountById(id: bigint, data: AccountUpdateInput): Promise<Account> {
    return await prisma.account.update({
        where: { id: id },
        data: {
            ...data,
        }
    })
}

export async function deleteAccountById(id: bigint): Promise<Account> {
    return await prisma.account.delete({
        where: { id },
    });
}