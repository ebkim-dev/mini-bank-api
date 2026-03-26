import request from "supertest";
import { createApp } from "../../../src/app";
import { logger } from "../../../src/logging/logger";
import { buildAuthInput, mockEncryptedRedisPayload } from "../../authMock";
import { buildTransferOutput, buildTransferRecord } from "../../transferMock";
import {
  mockAccountId1,
  mockMissingCustomerId,
  mockSessionId,
  mockTransferId1,
  mockMissingTransferId,
  mockCustomerId2,
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
  default: { transfer: { findUnique: jest.fn() } }
}));
import prismaClient from "../../../src/db/prismaClient";

jest.mock("../../../src/utils/encryption", () => ({
  decrypt: jest.fn()
}));
import { decrypt } from "../../../src/utils/encryption";
import { buildAccountRecord } from "../../accountMock";

const app = createApp();

const mockFindUnique = prismaClient.transfer.findUnique as jest.Mock;
const mockDecrypt = decrypt as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();

  (redisClient.multi as jest.Mock).mockReturnValue({
    get: jest.fn().mockReturnThis(),
    ttl: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([mockEncryptedRedisPayload, 999]),
  });
  mockDecrypt.mockReturnValue(JSON.stringify(buildAuthInput()));
  mockFindUnique.mockResolvedValue(buildTransferRecord());

  jest.spyOn(logger, "info").mockReturnValue(logger);
});

async function getTransferRequest(
  accountId = mockAccountId1,
  transferId = mockTransferId1,
  sessionId = mockSessionId
) {
  return request(app)
    .get(`/accounts/${accountId}/transfers/${transferId}`)
    .set("x-session-id", sessionId);
}

describe("GET /accounts/:accountId/transfers/:transferId", () => {
  it("should fetch transfer given valid inputs", async () => {
    mockFindUnique.mockResolvedValue({
      ...buildTransferRecord(),
      from_account: buildAccountRecord(),
      to_account: buildAccountRecord({ id: mockAccountId1 })
    });

    const res = await getTransferRequest();

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(buildTransferOutput());
  });
  
  it("should return 404 if transfer is not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await getTransferRequest(mockAccountId1, mockMissingTransferId);

    expect(res.status).toBe(404);
  });

  it("should return 403 if caller does not own transfer", async () => {
    mockDecrypt.mockReturnValue(JSON.stringify(
      buildAuthInput({ customerId: mockMissingCustomerId })
    ));
    mockFindUnique.mockResolvedValue({
      ...buildTransferRecord(),
      from_account: buildAccountRecord({ customer_id: mockCustomerId2 }),
      to_account: buildAccountRecord({ customer_id: mockCustomerId2 })
    });

    const res = await getTransferRequest();

    expect(res.status).toBe(403);
  });

  it("should return 500 if prisma throws", async () => {
    mockFindUnique.mockRejectedValue(new Error("DB failure"));

    const res = await getTransferRequest();

    expect(res.status).toBe(500);
  });
});