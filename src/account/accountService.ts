import type { Account } from '../generated/client';
import type { AuthInput } from '../auth/user';
import prismaClient from '../db/prismaClient'
import { AccountStatus } from "../generated/enums";
import { AppError } from "../error/error";
import { EventCode } from "../types/eventCodes";
import { logger } from '../logging/logger';
import type {
  AccountCreateInput,
  AccountOutput,
  AccountUpdateInput,
  AccountSummaryOutput
} from './account';
import {
  serializeAccount,
  serializeAccountSummary
} from './accountUtils';
import {
  throwIfAccountNotFound,
  throwIfAccountNotOwned
} from './accountAssertions';
import { 
  buildAccountFailureEvent,
  buildManyAccountSuccessEvent,
  buildSingleAccountSuccessEvent,
} from './accountEventFactories';


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

  logger.info(
    EventCode.ACCOUNT_CREATED, 
    buildSingleAccountSuccessEvent(start, authInput, accountRecord)
  );

  return serializeAccount(accountRecord);
}


export async function fetchAccountsByCustomerId(
  authInput: AuthInput
): Promise<AccountOutput[]> {
  const start = process.hrtime.bigint();

  const accountRecords: Account[] = await prismaClient.account.findMany({ 
    where: { customer_id: authInput.customerId }
  });

  logger.info(
    EventCode.ACCOUNT_FETCHED, 
    buildManyAccountSuccessEvent(start, authInput, accountRecords)
  );

  return accountRecords.map((accountRecord) => serializeAccount(accountRecord));
}


export async function fetchAccountById(
  accountId: string,
  authInput: AuthInput
): Promise<AccountOutput> {
  const start = process.hrtime.bigint();

  try {
    const account = await prismaClient.account.findUnique(
      { where: { id: accountId } }
    );

    throwIfAccountNotFound(account);
    throwIfAccountNotOwned(account, authInput);

    logger.info(
      EventCode.ACCOUNT_FETCHED, 
      buildSingleAccountSuccessEvent(start, authInput, account)
    );

    return serializeAccount(account);
  } catch (err) {
    if (err instanceof AppError) {
      logger.info(buildAccountFailureEvent(
        start,
        authInput,
        accountId,
        err.code as EventCode,
      ));
    }
    throw err;
  }
}


export async function updateAccountById(
  accountId: string, 
  data: AccountUpdateInput,
  authInput: AuthInput
): Promise<AccountOutput> {
  const start = process.hrtime.bigint();

  try {
    const account = await prismaClient.account.findUnique(
      { where: { id: accountId } }
    );

    throwIfAccountNotFound(account);
    throwIfAccountNotOwned(account, authInput);

    const updatedAccount = await prismaClient.account.update(
      { where: { id: accountId }, data }
    );
      
    logger.info(
      EventCode.ACCOUNT_UPDATED, 
      buildSingleAccountSuccessEvent(start, authInput, updatedAccount)
    );

    return serializeAccount(updatedAccount);
  } catch (err) {
    if (err instanceof AppError) {
      logger.info(buildAccountFailureEvent(
        start,
        authInput,
        accountId,
        err.code as EventCode,
        data
      ));
    }
    throw err;
  }
}


export async function deleteAccountById(
  accountId: string,
  authInput: AuthInput
): Promise<AccountOutput> {
  const start = process.hrtime.bigint();

  try {
    const account = await prismaClient.account.findUnique({
      where: { id: accountId }
    });

    throwIfAccountNotFound(account);
    throwIfAccountNotOwned(account, authInput);

    const closedAccount: Account = await prismaClient.account.update({
      where: { id: accountId }, data: { status: AccountStatus.CLOSED }
    });

    logger.info(
      EventCode.ACCOUNT_CLOSED, 
      buildSingleAccountSuccessEvent(start, authInput, closedAccount)
    );

    return serializeAccount(closedAccount);
  } catch (err) {
    if (err instanceof AppError) {
      logger.info(buildAccountFailureEvent(
        start,
        authInput,
        accountId,
        err.code as EventCode,
      ));
    }
    throw err;
  }
}


export async function fetchAccountSummary(
  accountId: string,
  authInput: AuthInput
): Promise<AccountSummaryOutput> {
  const start = process.hrtime.bigint();

  try {
    const account = await prismaClient.account.findUnique({
      where: { id: accountId },
    });

    throwIfAccountNotFound(account);
    throwIfAccountNotOwned(account, authInput);

    const recentTransactions = await prismaClient.transaction.findMany({
      where: { account_id: accountId },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    const counts = await prismaClient.transaction.groupBy({
      by: ["type"],
      where: { account_id: accountId },
      _count: { type: true },
    });

    const totalCredits =
      counts.find((c) => c.type === "CREDIT")?._count.type ?? 0;
    const totalDebits =
      counts.find((c) => c.type === "DEBIT")?._count.type ?? 0;

    logger.info(EventCode.ACCOUNT_FETCHED, buildSingleAccountSuccessEvent(
      start,
      authInput,
      account
    ));

    return serializeAccountSummary(
      account, totalCredits, totalDebits, recentTransactions
    )
  } catch (err) {
    if (err instanceof AppError) {
      logger.info(buildAccountFailureEvent(
        start,
        authInput,
        accountId,
        err.code as EventCode,
      ));
    }
    throw err;
  }
}