
import { Router } from 'express';
import type { Request, Response } from 'express';
import {
    createAccount,
    getAccountsByCustomerId,
    getAccount,
    updateAccount,
    deleteAccount
} from '../controller/accountController';

const accountRouter = Router();

// POST /accounts creates an account record in MySQL
// TODO 
accountRouter.post('/', createAccount);

// GET /accounts?customerId=... returns only accounts belonging to that customer
accountRouter.get('/', getAccountsByCustomerId);

// GET /accounts/:accountId returns account details; if not found → 404 
accountRouter.get('/:id', getAccount);

// PUT /accounts/:accountId updates allowed fields only (e.g., nickname/status) 
accountRouter.put('/:id', updateAccount);

// POST /accounts/:accountId/close closes the account 
accountRouter.post('/:id/close', deleteAccount);

export default accountRouter;



