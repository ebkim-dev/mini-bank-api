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

// export async function fetchAllUsers(): Promise<User[]> {
//     return await prisma.user.findMany();
// }

// export async function fetchUserById(id: bigint): Promise<User | null> {
//     return await prisma.user.findUnique({ 
//         where: { id },
//     });
// }

// export async function updateUserById(id: bigint, data: UserUpdateInput): Promise<User> {
//     return await prisma.user.update({
//         where: { id: id },
//         data: {
//             ...data,
//         }
//     })
// }

// export async function deleteUserById(id: bigint): Promise<User> {
//     return await prisma.user.delete({
//         where: { id },
//     });
// }