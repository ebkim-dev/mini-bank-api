import type { Request, Response } from 'express';
import { Prisma } from '../generated/client';

import * as accountService from '../service/accountService';
import { isNullOrEmpty } from '../utils/nullEmptyCheck';
import { serializeAccount, serializeAccounts } from '../utils/serializeAccount'
import { AccountCreateInput } from '../types/account';

// POST /accounts
export async function createAccount(req: Request, res: Response): Promise<void> {
    const data = req.body;

    // Basic null/empty check
    if (isNullOrEmpty(data)) {
        res.status(400).json({ message: "Request body is empty" });
        return;
    }

    // Required fields check
    const { 
        customer_id,
        type,
        currency,
        nickname,
        status,
        balance,
    } = data as AccountCreateInput;

    if (!customer_id || !type || !currency) {
        res.status(400).json({ message: "Missing required fields" });
        return;
    }

    try {
        const newAccount = await accountService.insertAccount(data);
        res.status(201).json(serializeAccount(newAccount)); // 201 = Created
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            const prismaErr = err as Prisma.PrismaClientKnownRequestError;
            if (prismaErr.code === 'P2002') {
                res.status(400).json({ message: 'Username already exists' });
            }
        } else if (err instanceof Error) {
            res.status(500).json({ message: "Failed to create account", error: err.message });
        } else {
            res.status(500).json({ message: "Failed to create account", error: String(err) });
        }
    }
}

// GET /users
export async function getAccountsByCustomerId(req: Request, res: Response): Promise<void> {
    const { customerId } = req.query;

    if (typeof customerId !== 'string') {
        res.status(400).json({ message: 'Invalid or missing customerId' });
        return;
    }

    try {
        const accounts = await accountService.fetchAccountsByCustomerId(BigInt(customerId));
        res.status(200).json(serializeAccounts(accounts));
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ message: "Failed to find account", error: message });
    }
}

// GET /users/:id
export async function getAccount(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (typeof id !== 'string') {
        res.status(400).json({ message: 'Invalid account id' });
        return;
    }

    try {
        const account = await accountService.fetchAccountById(BigInt(id));
        if (!account) {
            res.status(404).json({ message: 'Account not found' });
        } else {
            res.status(200).json(serializeAccount(account));
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ message: "Failed to find account", error: message });
    }
}

// PATCH /users/:id (has body)
export async function updateAccount(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (typeof id !== 'string') {
        res.status(400).json({ message: 'Invalid account id' });
        return;
    }
    
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
        res.status(400).json({ message: "No fields provided to update" });
        return;
    }

    try {
        const account = await accountService.updateAccountById(BigInt(id), data);
        res.status(200).json(serializeAccount(account));
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ message: "Failed to find account", error: message });
    }
}

// DELETE /users/:id
export async function deleteAccount(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {  // string | string[] | undefined
        res.status(400).json({ message: 'Invalid account id' });
        return;
    }
    
    try {
        const account = await accountService.deleteAccountById(BigInt(id));

        if (!account) {
            res.status(404).json({ message: 'Account not found' });
        } else {
            res.status(200).json(serializeAccount(account));
        }    
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ message: "Failed to find account", error: message });
    }
}

