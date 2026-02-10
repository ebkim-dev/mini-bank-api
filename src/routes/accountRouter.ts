
import { Router } from 'express';
import type { Request, Response } from 'express';
import * as accountMiddleware from '../controller/accountController';

const accountRouter = Router();

accountRouter.get('/hello', accountMiddleware.dummyTest);

// POST /accounts creates an account record in MySQL
// TODO 
accountRouter.post('/', accountMiddleware.createAccount);

// GET /accounts?customerId=... returns only accounts belonging to that customer
// accountRouter.get('/', accountMiddleware.fetchAccountByCustomerId);

// GET /accounts/:accountId returns account details; if not found → 404 
// accountRouter.get('/:id', accountMiddleware.fetchAccountByAccountId);

// PUT /accounts/:accountId updates allowed fields only (e.g., nickname/status) 
// accountRouter.put('/:id', accountMiddleware.updateAccountById);

// POST /accounts/:accountId/close closes the account 
// accountRouter.post('/:id/close', accountMiddleware.closeAccount);

export default accountRouter;



