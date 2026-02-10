import type { Request, Response } from 'express';

import { serializeAccount } from '../utils/serializeAccount'

import { Prisma } from '../generated/client';

import * as accountService from '../service/accountService';
import { isNullOrEmpty } from '../utils/nullEmptyCheck';
import { AccountCreateInput } from '../types/account';

// GET /
export async function dummyTest(req: Request, res: Response): Promise<void> {
    res.status(200).json({ message: 'Hello World!' });
}

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
            res.status(500).json({ message: "Failed to create user", error: err.message });
        } else {
            res.status(500).json({ message: "Failed to create user", error: String(err) });
        }
    }
}
/*
// GET /users
export async function getAllUsers(req: Request, res: Response): Promise<void> {
    try {
        const users = await userService.fetchAllUsers();
        res.status(200).json(serializeUsers(users));
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ message: "Failed to find users", error: err.message });
        } else {
            res.status(500).json({ message: "Failed to find users", error: String(err) });
        }
    }
}

// GET /users/:id
export async function getUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {  // string | string[] | undefined
        res.status(400).json({ message: 'Invalid user id' });
        return;
    }

    try {
        const user = await userService.fetchUserById(BigInt(id));
        if (!user) {
            res.status(404).json({ message: 'User not found' });
        } else {
            res.status(200).json(serializeUser(user));
        }
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ message: "Failed to get user", error: err.message });
        } else {
            res.status(500).json({ message: "Failed to get user", error: String(err) });
        }
    }
}

// PATCH /users/:id (has body)
export async function updateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {  // string | string[] | undefined
        res.status(400).json({ message: 'Invalid user id' });
        return;
    }
    
    const data = req.body; // { username?, password_hash?, role? }

    // Basic null/empty check
    if (!data || Object.keys(data).length === 0) {
        res.status(400).json({ message: "No fields provided to update" });
        return;
    }

    try {
        const user = await userService.updateUserById(BigInt(id), data);
        res.status(200).json(serializeUser(user));
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ message: "Failed to update user", error: err.message });
        } else {
            res.status(500).json({ message: "Failed to update user", error: String(err) });
        }
    }
}

// DELETE /users/:id
export async function deleteUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {  // string | string[] | undefined
        res.status(400).json({ message: 'Invalid user id' });
        return;
    }
    
    try {
        const user = await userService.deleteUserById(BigInt(id));

        if (!user) {
            res.status(404).json({ message: 'User not found' });
        } else {
            res.status(200).json(serializeUser(user));
        }    
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ message: "Failed to delete user", error: err.message });
        } else {
            res.status(500).json({ message: "Failed to delete user", error: String(err) });
        }
    }
}

*/