import type {
  AccountCreateInput,
  AccountOutput,
  AccountUpdateInput,
} from './account';
import type { Account } from '../generated/client';
import type { AuthInput } from '../auth/user';
import prismaClient from '../db/prismaClient'
import { Prisma } from "../generated/client";
import { AccountStatus, UserRole } from "../generated/enums";
import { ForbiddenError, NotFoundError } from "../error/error";
import { EventCode } from "../types/eventCodes";
import { serializeAccount } from './accountUtils';
import { 
  AccountFailByAccountEvent,
  AccountFailByCustomerEvent, 
  ExecutionStatus, 
  logEvent,
  mapToManyAccountSuccessEvent,
  mapToSingleAccountSuccessEvent,
} from '../logging/logSchemas';
import { getDurationMs } from '../utils/calculateDuration';


export async function insertAccount(
  data: AccountCreateInput,
  authInput: AuthInput
): Promise<AccountOutput> {
  const start = process.hrtime.bigint();

  if (authInput.role !== UserRole.ADMIN) {
    const event: AccountFailByCustomerEvent = {
      executionStatus: ExecutionStatus.FAILURE,
      durationMs: getDurationMs(start),
      actorId: authInput.actorId,
      actorRole: authInput.role,
      customerId: data.customer_id.toString(),
      accountType: data.type,
      currency: data.currency,
      ...(data.status !== undefined && { accountStatus: data.status }),
      errorCode: EventCode.FORBIDDEN
    };
    logEvent(EventCode.FORBIDDEN, event);
    throw ForbiddenError(EventCode.FORBIDDEN, "Only admins can create accounts");
  }

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

  logEvent(EventCode.ACCOUNT_CREATED, mapToSingleAccountSuccessEvent(
    getDurationMs(start),
    authInput,
    accountRecord
  ));

  return serializeAccount(accountRecord);
}


export async function fetchAccountsByCustomerId(
  customer_id: bigint,
  authInput: AuthInput
): Promise<AccountOutput[]> {
  const start = process.hrtime.bigint();

  const accountRecords: Account[] = 
    await prismaClient.account.findMany({ where: { customer_id } });

  logEvent(EventCode.ACCOUNT_FETCHED, mapToManyAccountSuccessEvent(
    getDurationMs(start),
    authInput,
    accountRecords
  ));

  return accountRecords.map((accountRecord) => serializeAccount(accountRecord));
}


export async function fetchAccountById(
  id: bigint,
  authInput: AuthInput
): Promise<AccountOutput> {
  const start = process.hrtime.bigint();

  const accountRecord: Account | null = 
    await prismaClient.account.findUnique({ where: { id } });

  if (!accountRecord) {
    const event: AccountFailByAccountEvent = {
      executionStatus: ExecutionStatus.FAILURE,
      durationMs: getDurationMs(start),
      actorId: authInput.actorId,
      actorRole: authInput.role,
      accountId: id.toString(),
      errorCode: EventCode.ACCOUNT_NOT_FOUND
    };
    logEvent(EventCode.ACCOUNT_NOT_FOUND, event);
    throw NotFoundError(
      EventCode.ACCOUNT_NOT_FOUND, 
      "Account not found", 
      { id }
    );
  }

  logEvent(EventCode.ACCOUNT_FETCHED, mapToSingleAccountSuccessEvent(
    getDurationMs(start),
    authInput,
    accountRecord
  ));

  return serializeAccount(accountRecord);
}


export async function updateAccountById(
  id: bigint, 
  data: AccountUpdateInput,
  authInput: AuthInput
): Promise<AccountOutput> {
  const start = process.hrtime.bigint();

  if (authInput.role !== UserRole.ADMIN) {
    const event: AccountFailByAccountEvent = {
      executionStatus: ExecutionStatus.FAILURE,
      durationMs: getDurationMs(start),
      actorId: authInput.actorId,
      actorRole: authInput.role,
      accountId: id.toString(),
      ...(data.nickname !== undefined && { nickname: data.nickname }),
      ...(data.status !== undefined && { accountStatus: data.status }),
      errorCode: EventCode.FORBIDDEN
    };
    logEvent(EventCode.FORBIDDEN, event);
    throw ForbiddenError(EventCode.FORBIDDEN, "Only admins can update accounts");
  }

  try {
    const accountRecord: Account = 
      await prismaClient.account.update({
        where: { id },
        data
      });
      
    logEvent(EventCode.ACCOUNT_UPDATED, mapToSingleAccountSuccessEvent(
      getDurationMs(start),
      authInput,
      accountRecord
    ));
    return serializeAccount(accountRecord);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError && 
      err.code === "P2025"
    ) {
      const event: AccountFailByAccountEvent = {
        executionStatus: ExecutionStatus.FAILURE,
        durationMs: getDurationMs(start),
        actorId: authInput.actorId,
        actorRole: authInput.role,
        accountId: id.toString(),
        ...(data.nickname !== undefined && { nickname: data.nickname }),
        ...(data.status !== undefined && { accountStatus: data.status }),
        errorCode: EventCode.ACCOUNT_NOT_FOUND
      };
      logEvent(EventCode.ACCOUNT_NOT_FOUND, event);

      throw NotFoundError(
        EventCode.ACCOUNT_NOT_FOUND, 
        "Account not found", 
        { id }
      );
    }
    throw err;
  }
}


export async function deleteAccountById(
  id: bigint,
  authInput: AuthInput
): Promise<AccountOutput> {
  const start = process.hrtime.bigint();

  if (authInput.role !== UserRole.ADMIN) {
    const event: AccountFailByAccountEvent = {
      executionStatus: ExecutionStatus.FAILURE,
      durationMs: getDurationMs(start),
      actorId: authInput.actorId,
      actorRole: authInput.role,
      accountId: id.toString(),
      errorCode: EventCode.FORBIDDEN
    };
    logEvent(EventCode.FORBIDDEN, event);
    throw ForbiddenError(EventCode.FORBIDDEN, "Only admins can close accounts");
  }

  try {
    const accountRecord: Account = 
      await prismaClient.account.update({
        where: { id },
        data: { status: AccountStatus.CLOSED }
      });

    logEvent(EventCode.ACCOUNT_CLOSED, mapToSingleAccountSuccessEvent(
      getDurationMs(start),
      authInput,
      accountRecord
    ));
    return serializeAccount(accountRecord);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError && 
      err.code === "P2025"
    ) {
      const event: AccountFailByAccountEvent = {
        executionStatus: ExecutionStatus.FAILURE,
        durationMs: getDurationMs(start),
        actorId: authInput.actorId,
        actorRole: authInput.role,
        accountId: id.toString(),
        errorCode: EventCode.ACCOUNT_NOT_FOUND
      };
      logEvent(EventCode.ACCOUNT_NOT_FOUND, event);

      throw NotFoundError(
        EventCode.ACCOUNT_NOT_FOUND, 
        "Account not found", 
        { id }
      );
    }
    throw err;
  }
}