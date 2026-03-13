import type {
  AccountCreateInput,
  AccountOutput,
  AccountUpdateInput,
} from './account';
import type { Account } from '../generated/client';
import type { AuthInput } from '../auth/user';
import prismaClient from '../db/prismaClient'
import { AccountStatus, UserRole } from "../generated/enums";
import { ForbiddenError, NotFoundError } from "../error/error";
import { EventCode } from "../types/eventCodes";
import { serializeAccount } from './accountUtils';
import { logger } from '../logging/logger';
import { 
  buildAccountFailEvent,
  buildManyAccountSuccessEvent,
  buildSingleAccountSuccessEvent
} from '../logging/eventFactories';


export async function insertAccount(
  data: AccountCreateInput,
  authInput: AuthInput
): Promise<AccountOutput> {
  const start = process.hrtime.bigint();

  const accountRecord: Account = await prismaClient.account.create({
    data: {
      customer_id: authInput.customerId,
      type: data.type,
      currency: data.currency,
      nickname: data.nickname ?? null,
      status: data.status ?? AccountStatus.ACTIVE,
      balance: data.balance ?? 0,
    },
  });

  logger.info(EventCode.ACCOUNT_CREATED, buildSingleAccountSuccessEvent(
    start, authInput, accountRecord
  ));

  return serializeAccount(accountRecord);
}


export async function fetchAccountsByCustomerId(
  authInput: AuthInput
): Promise<AccountOutput[]> {
  const start = process.hrtime.bigint();

  const accountRecords: Account[] = await prismaClient.account.findMany({ 
    where: { customer_id: authInput.customerId }
  });

  logger.info(EventCode.ACCOUNT_FETCHED, buildManyAccountSuccessEvent(
    start, authInput, accountRecords
  ));

  return accountRecords.map((accountRecord) => serializeAccount(accountRecord));
}


export async function fetchAccountById(
  id: string,
  authInput: AuthInput
): Promise<AccountOutput> {
  const start = process.hrtime.bigint();

  const account = await prismaClient.account.findUnique({ where: { id } });
  if (!account) {
    logger.info(
      EventCode.ACCOUNT_NOT_FOUND,
      buildAccountFailEvent(start, authInput, id, EventCode.ACCOUNT_NOT_FOUND)
    );
    throw NotFoundError(EventCode.ACCOUNT_NOT_FOUND, "Account not found", { id });
  }

  if ( authInput.role !== UserRole.ADMIN
    && authInput.customerId !== account.customer_id ) {  
    const forbiddenErrorMessage = "Only account owners can read accounts";
    logger.info(
      EventCode.FORBIDDEN,
      buildAccountFailEvent(start, authInput, id, EventCode.FORBIDDEN)
    );
    throw ForbiddenError(EventCode.FORBIDDEN, forbiddenErrorMessage);
  }

  logger.info(EventCode.ACCOUNT_FETCHED, buildSingleAccountSuccessEvent(
    start, authInput, account
  ));

  return serializeAccount(account);
}


export async function updateAccountById(
  id: string, 
  data: AccountUpdateInput,
  authInput: AuthInput
): Promise<AccountOutput> {
  const start = process.hrtime.bigint();

  const account = await prismaClient.account.findUnique({ where: { id } });
  if (!account) {
    logger.info(
      EventCode.ACCOUNT_NOT_FOUND,
      buildAccountFailEvent(start, authInput, id, EventCode.ACCOUNT_NOT_FOUND, data)
    );
    throw NotFoundError(EventCode.ACCOUNT_NOT_FOUND, "Account not found", { id });
  }

  if ( authInput.role !== UserRole.ADMIN 
    && authInput.customerId !== account.customer_id ) {
    const forbiddenErrorMessage = "Only account owners can update accounts";
    logger.info(
      EventCode.FORBIDDEN,
      buildAccountFailEvent(start, authInput, id, EventCode.FORBIDDEN, data)
    );
    throw ForbiddenError(EventCode.FORBIDDEN, forbiddenErrorMessage);
  }

  const updatedAccount: Account = await prismaClient.account.update({
    where: { id }, data
  });
    
  logger.info(EventCode.ACCOUNT_UPDATED, buildSingleAccountSuccessEvent(
    start, authInput, updatedAccount
  ));

  return serializeAccount(updatedAccount);
}


export async function deleteAccountById(
  id: string,
  authInput: AuthInput
): Promise<AccountOutput> {
  const start = process.hrtime.bigint();

  const account = await prismaClient.account.findUnique({ where: { id } });
  if (!account) {
    logger.info(
      EventCode.ACCOUNT_NOT_FOUND,
      buildAccountFailEvent(start, authInput, id, EventCode.ACCOUNT_NOT_FOUND)
    );
    throw NotFoundError(EventCode.ACCOUNT_NOT_FOUND, "Account not found", { id });
  }

  if ( authInput.role !== UserRole.ADMIN 
    && authInput.customerId !== account.customer_id ) {
    const forbiddenErrorMessage = "Only account owners can close accounts";
    logger.info(
      EventCode.FORBIDDEN,
      buildAccountFailEvent(start, authInput, id, EventCode.FORBIDDEN)
    );
    throw ForbiddenError(EventCode.FORBIDDEN, forbiddenErrorMessage);
  }

  const closedAccount: Account = await prismaClient.account.update({
    where: { id }, data: { status: AccountStatus.CLOSED }
  });

  logger.info(EventCode.ACCOUNT_CLOSED, buildSingleAccountSuccessEvent(
    start, authInput, closedAccount
  ));

  return serializeAccount(closedAccount);
}