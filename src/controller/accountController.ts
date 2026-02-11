import type { Request, Response } from 'express';
import { Prisma } from '../generated/client';

import * as accountService from '../service/accountService';
import { isNullOrEmpty } from '../utils/nullEmptyCheck';
import { serializeAccount, serializeAccounts } from '../utils/serializeAccount'
import { AccountCreateInput } from '../types/account';

import {
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
    ConflictError,
    InternalServerError,
} from '../utils/error'

import { ErrorCode } from '../types/errorCodes'; 

// POST /accounts
export async function createAccount(req: Request, res: Response): Promise<void> {
    const data = req.body;
    if (isNullOrEmpty(data)) {
        throw BadRequestError(ErrorCode.EMPTY_BODY, "Request body is empty");
    }

    const { customer_id, type, currency } = data as AccountCreateInput;
    if (!customer_id || !type || !currency) {
        throw BadRequestError(ErrorCode.MISSING_REQUIRED_FIELDS, "Missing required fields");
    }

    const newAccount = await accountService.insertAccount(data).catch((err) => {
        throw InternalServerError("Internal Server Error", { 
            originalError: err instanceof Error ? err.message : String(err) 
        });
    });

    res.status(201).json(serializeAccount(newAccount));
}

// GET /accounts?customerId=...
export async function getAccountsByCustomerId(req: Request, res: Response): Promise<void> {
    const { customerId } = req.query;

    if (typeof customerId !== 'string') {
        throw BadRequestError(ErrorCode.INVALID_CUSTOMER_ID, "Invalid or missing customer ID");
    }

    const accounts = await accountService.fetchAccountsByCustomerId(BigInt(customerId))
        .catch((err) => {
            throw InternalServerError("Internal Server Error", { 
                originalError: err instanceof Error ? err.message : String(err) 
            });
        });

    res.status(200).json(serializeAccounts(accounts));
}

// GET /accounts/:accountId
export async function getAccount(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (typeof id !== 'string') {
        throw BadRequestError(ErrorCode.INVALID_ACCOUNT_ID, "Invalid or missing account ID");
    }
    
    const account = await accountService.fetchAccountById(BigInt(id))
        .catch((err) => {
            throw InternalServerError("Internal Server Error", { 
                originalError: err instanceof Error ? err.message : String(err) 
            });
        });

    if (!account) {
        throw NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found");
    }
    res.status(200).json(serializeAccount(account));
}

// PUT /accounts/:accountId
export async function updateAccount(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (typeof id !== 'string') {
        throw BadRequestError(ErrorCode.INVALID_ACCOUNT_ID, "Invalid or missing account ID");
    }
    
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
        throw BadRequestError(ErrorCode.MISSING_REQUIRED_FIELDS, "No fields provided to update");
    }

    const account = await accountService.updateAccountById(BigInt(id), data)
        .catch((err) => {
            throw InternalServerError("Internal Server Error", { 
                originalError: err instanceof Error ? err.message : String(err) 
            });
        });

    res.status(200).json(serializeAccount(account));
}

// POST /accounts/:accountId/close
export async function deleteAccount(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
        throw BadRequestError(ErrorCode.INVALID_ACCOUNT_ID, "Invalid account id");
    }
    
    const account = await accountService.deleteAccountById(BigInt(id))
        .catch((err) => {
            throw InternalServerError("Internal Server Error", { 
                originalError: err instanceof Error ? err.message : String(err) 
            });
        });

    if (!account) {
        throw NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found");
    }
    res.status(200).json(serializeAccount(account));
}

