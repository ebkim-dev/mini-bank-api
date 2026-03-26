import request from "supertest";
import { createApp } from "../../../src/app";
import { logger } from "../../../src/logging/logger";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { buildTransferRecord } from "../../transferMock";
import {
  mockAccountId1,
  mockMissingCustomerId,
  mockSessionId,
  mockAccountId2,
} from "../../commonMock";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: {
    multi: jest.fn(() => ({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    })),
    expire: jest.fn(),
  }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: { 
    account: { findUnique: jest.fn() },
    transfer: { findMany: jest.fn() } 
  }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";
import { buildAccountRecord } from "../../accountMock";
import { serializeTransfer } from "../../../src/transfer/transferUtils";

const app = createApp();

const mockedTransferList = [
  buildTransferRecord(), 
  buildTransferRecord({
    from_account_id: mockAccountId2,
    to_account_id: mockAccountId1,
  })
];

const mockDecrypt = decrypt as jest.Mock;
const mockFindUnique = prismaClient.account.findUnique as jest.Mock;
const mockFindMany = prismaClient.transfer.findMany as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();

  (redisClient.multi as jest.Mock).mockReturnValue({
    get: jest.fn().mockReturnThis(),
    ttl: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([mockEncryptedRedisPayload, 999]),
  });
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
  mockFindUnique.mockResolvedValue(buildAccountRecord());
  mockFindMany.mockResolvedValue(mockedTransferList);

  jest.spyOn(logger, "info").mockReturnValue(logger);
});

async function getTransfersRequest(
  query: Record<string, string> = {},
  accountId = mockAccountId1,
  sessionId = mockSessionId
) {
  return request(app)
    .get(`/accounts/${accountId}/transfers`)
    .set("x-session-id", sessionId)
    .query(query);
}

describe("GET /accounts/:accountId/transfers", () => {
  it("should fetch list of transfers given valid inputs", async () => {
    const res = await getTransfersRequest();

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(
      mockedTransferList.map(serializeTransfer)
    );
  });

  it("should return empty list if no transfers match query", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await getTransfersRequest();

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
  
  it("should return 404 if account is not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await getTransfersRequest();

    expect(res.status).toBe(404);
  });

  it("should return 403 if caller does not own account", async () => {
    mockDecrypt.mockReturnValue(JSON.stringify(
      buildAuthInput({ customerId: mockMissingCustomerId })
    ));

    const res = await getTransfersRequest();

    expect(res.status).toBe(403);
  });

  it("should return 500 if prisma throws", async () => {
    mockFindMany.mockRejectedValue(new Error("DB failure"));

    const res = await getTransfersRequest();

    expect(res.status).toBe(500);
  });
});