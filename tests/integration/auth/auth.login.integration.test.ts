jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedMockPassword"),
  compare: jest.fn((plain: string, _hash: string) => {
    if (plain === "mockPassword") {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }),
}));
import bcrypt from "bcrypt";

jest.mock("../../../src/redis/redisClient", () => ({
  redisClient: { set: jest.fn() }
}));
import { redisClient } from "../../../src/redis/redisClient";

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: { user: { findUnique: jest.fn() } }
}));
import prismaClient from "../../../src/db/prismaClient";

import request from "supertest";
import { createApp } from "../../../src/app";
import { LoginInput } from "../../../src/auth/user";
import { mockUsername } from "../../commonMock";
import { 
  buildLoginInput,
  buildUserRecord,
} from "../../authMock";

const app = createApp();

const mockFindUnique = prismaClient.user.findUnique as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  mockFindUnique.mockResolvedValue(buildUserRecord());
});

describe("POST /auth/login", () => {
  async function loginRequest(
    loginInput: Partial<LoginInput> = {},
  ) {
    return request(app).post("/auth/login").send(loginInput);
  }
  
  test("Correct credentials => 201, login succeeds", async () => {
    const mockLoginInput = buildLoginInput({
      username: mockUsername,
      password: "mockPassword",
    });

    const res = await loginRequest(mockLoginInput);

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body.sessionId).toEqual(expect.any(String));
  });

  test("Missing username => 400", async () => {
    const mockLoginInput: any = buildLoginInput();
    delete mockLoginInput.username;

    const res = await loginRequest(mockLoginInput);

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Missing password => 400", async () => {
    const mockLoginInput: any = buildLoginInput();
    delete mockLoginInput.password;

    const res = await loginRequest(mockLoginInput);

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Empty body => 400", async () => {
    const res = await loginRequest({});

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Wrong type (username number) => 400", async () => {
    const res = await loginRequest(buildLoginInput({ username: 123 as any }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Wrong type (password number) => 400", async () => {
    const res = await loginRequest(buildLoginInput({ password: 123 as any }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("User not found => 401", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const res = await loginRequest(buildLoginInput({ username: mockUsername }));

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Wrong password => 401", async () => {
    const res = await loginRequest(buildLoginInput({ 
      password: "wrong_password_123"
    }));

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Large username (longer than maxLength) => 400", async () => {
    const longUsername = "u".repeat(500);
    const res = await loginRequest(buildLoginInput({ username: longUsername }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Large password (longer than maxLength) => 400", async () => {
    const longPassword = "p".repeat(500);

    const res = await loginRequest(buildLoginInput({ password: longPassword }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });
});