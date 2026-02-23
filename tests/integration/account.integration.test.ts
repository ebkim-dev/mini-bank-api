jest.mock("../../src/db/prismaClient", () => ({
  account: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

import request from "supertest";
import { createApp } from "../../src/app";
import prisma from "../../src/db/prismaClient";
import { AccountStatus } from "../../src/generated/enums";
import { ErrorCode } from "../../src/types/errorCodes";

const app = createApp();

describe("POST /accounts", () => {
  it("should reject empty body and return 400", async () => {
    const mockAccount = {
      id: "1",
      customer_id: "1",
      type: "SAVINGS",
      currency: "USD",
      created_at: new Date(),
    };

    (prisma.account.create as jest.Mock).mockResolvedValue(mockAccount);

    const response = await request(app)
      .post("/accounts")
      .send();

    expect(response.status).toBe(400);
  });

  it("should create an account and return 201", async () => {
    const created_at = new Date();

    const mockAccount = {
      id: 1n,
      customer_id: 1n,
      type: "SAVINGS",
      currency: "USD",
      balance: 0,
      created_at: created_at,
    };

    (prisma.account.create as jest.Mock).mockResolvedValue(mockAccount);

    const response = await request(app)
      .post("/accounts")
      .send({
        customer_id: "1",
        type: "SAVINGS",
        currency: "USD",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: "1",
      customer_id: "1",
      type: "SAVINGS",
      currency: "USD",
      balance: "0",
    });
    expect(new Date(response.body.created_at)).toEqual(created_at);
  });
});

describe("GET /accounts?customerId=...", () => {
  it("should return 400 for nonnumeric customer ID", async () => {
    const created_at = new Date();
    const customer_id = "abcde";

    const mockAccount = {
      id: 1n,
      customer_id: customer_id,
      type: "SAVINGS",
      currency: "USD",
      created_at: created_at,
      balance: 0,
    };

    (prisma.account.findMany as jest.Mock).mockResolvedValue([mockAccount]);

    const response = await request(app).get("/accounts?customerId=" + customer_id);

    expect(response.status).toBe(400);    
    expect(response.body).toMatchObject({});
  });

  it("should return empty list from nonexistent customer ID and return 200", async () => {
    const created_at = new Date();
    const customer_id = 9999999n;

    const mockAccount = {
      id: 1n,
      customer_id: customer_id,
      type: "SAVINGS",
      currency: "USD",
      created_at: created_at,
      balance: 0,
    };

    (prisma.account.findMany as jest.Mock).mockResolvedValue([mockAccount]);

    const response = await request(app).get("/accounts?customerId=" + customer_id);

    expect(response.status).toBe(200);    
    expect(response.body).toMatchObject({});
  });

  it("should get all accounts by customer ID and return 200", async () => {
    const created_at = new Date();

    const mockAccount = {
      id: 1n,
      customer_id: 1n,
      type: "SAVINGS",
      currency: "USD",
      created_at: created_at,
      balance: 0,
    };

    (prisma.account.findMany as jest.Mock).mockResolvedValue([mockAccount]);

    const response = await request(app).get("/accounts?customerId=1");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject([{
      id: "1",
      customer_id: "1",
      type: "SAVINGS",
      currency: "USD",
      created_at: created_at.toISOString(),
      balance: "0",
    }]);
  });
});

describe("GET /accounts/:accountId", () => {
  it("should return 404 given null response from db", async() => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await request(app).get("/accounts/1");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({});
  });

  it("should find account by given account ID and return 200", async () => {
    const created_at = new Date();

    const mockAccount = {
      id: 1n,
      customer_id: 1n,
      type: "SAVINGS",
      currency: "USD",
      created_at: created_at,
      balance: 0,
    };

    (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);

    const response = await request(app).get("/accounts/1");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: "1",
      customer_id: "1",
      type: "SAVINGS",
      currency: "USD",
      created_at: created_at.toISOString(),
      balance: "0",
    });
  });
});

describe("PUT /accounts/:accountId", () => {
  it("should return 400 given invalid update body", async() => {
    const created_at = new Date();
    const accountId = 1n;

    const mockAccount = {
      id: accountId,
      customer_id: 1n,
      type: "SAVINGS",
      currency: "USD",
      status: AccountStatus.ACTIVE,
      created_at: created_at,
      balance: 0,
    };

    (prisma.account.update as jest.Mock).mockResolvedValue(mockAccount);

    const response = await request(app)
    .put("/accounts/" + accountId.toString())
    .send({
      id: "accountId + 1n", // invalid field
      nickname: "dummy nickname",
      status: AccountStatus.ACTIVE,
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("code", ErrorCode.VALIDATION_ERROR);
  });

  it("should call Prisma to update an account and return serialized 200 response", async () => {
    const created_at = new Date();
    const accountId = 1n;

    const mockAccount = {
      id: accountId,
      customer_id: 1n,
      type: "SAVINGS",
      currency: "USD",
      nickname: "dummy nickname",
      status: AccountStatus.ACTIVE,
      created_at: created_at,
      balance: 0,
    };

    (prisma.account.update as jest.Mock).mockResolvedValue(mockAccount);

    const response = await request(app)
    .put("/accounts/" + accountId.toString())
    .send({
      nickname: "dummy nickname",
      status: AccountStatus.ACTIVE,
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: accountId.toString(),
      customer_id: "1",
      type: "SAVINGS",
      currency: "USD",
      nickname: "dummy nickname",
      status: AccountStatus.ACTIVE,
      created_at: created_at.toISOString(),
      balance: "0",
    });
  });
});

describe("POST /accounts/:accountId/close", () => {
  it("should return 400 given invalid account ID", async () => {
    const created_at = new Date();
    const accountId = "qweqwe";

    const mockAccount = {
      id: accountId,
      customer_id: 1n,
      type: "SAVINGS",
      currency: "USD",
      status: AccountStatus.CLOSED,
      created_at: created_at,
      balance: 0,
    };

    (prisma.account.update as jest.Mock).mockResolvedValue(mockAccount);

    const response = await request(app).post("/accounts/" + accountId.toString() + "/close");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("code", ErrorCode.VALIDATION_ERROR);
  });

  it("should call Prisma to close an account and return serialized 200 response", async () => {
    const created_at = new Date();
    const accountId = 1n;

    const mockAccount = {
      id: accountId,
      customer_id: 1n,
      type: "SAVINGS",
      currency: "USD",
      status: AccountStatus.CLOSED,
      created_at: created_at,
      balance: 0,
    };

    (prisma.account.update as jest.Mock).mockResolvedValue(mockAccount);

    const response = await request(app).post("/accounts/" + accountId.toString() + "/close");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: accountId.toString(),
      customer_id: "1",
      type: "SAVINGS",
      currency: "USD",
      status: AccountStatus.CLOSED,
      created_at: created_at.toISOString(),
      balance: "0",
    });
  });
});
