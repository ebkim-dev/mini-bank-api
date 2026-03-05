import request from "supertest";
import * as crypto from "crypto";
import { createApp } from "../../../src/app";
import { UserRole } from "../../../src/generated/enums";
import { Prisma, User } from "../../../src/generated/client";
import { 
  buildRegisterInput, 
  buildRegisterOutput, 
  buildLoginInput, 
  buildLoginOutput
} from "./auth.mock";

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword"),
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
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn()
    }
  },
}));
import prismaClient from "../../../src/db/prismaClient";

const app = createApp();

function buildMockUserRecord(overrides = {}): User {
  const mockDate = new Date();
  const mockUserRecord: User = {
    id: "550e8400-e29b-41d4-a716-446655440042",
    username: "mockUser",
    password_hash: "hashedPassword",
    role: UserRole.ADMIN,
    created_at: mockDate,
    updated_at: mockDate,
  };
  return mockUserRecord;
}

const mockCreate = prismaClient.user.create as jest.Mock;
const mockFindUnique = prismaClient.user.findUnique as jest.Mock;
beforeEach(() => {
  mockCreate.mockResolvedValue(buildMockUserRecord());
  mockFindUnique.mockResolvedValue(buildMockUserRecord());
});

describe("POST /auth/register", () => {
  test("Correct input => 201, new user is created and id is returned", async () => {
    const mockRegisterInput = buildRegisterInput();
    const mockRegisterOutput = buildRegisterOutput();

    const res = await request(app).post("/auth/register").send(mockRegisterInput);

    expect(res.status).toBe(201);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(mockRegisterOutput);
    
  });

  test("Missing username => 400", async () => {
    const mockRegisterInput: any = buildRegisterInput();
    delete mockRegisterInput.username;

    const res = await request(app).post("/auth/register").send(mockRegisterInput);

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Missing password => 400", async () => {
    const mockRegisterInput: any = buildRegisterInput();
    delete mockRegisterInput.password;

    const res = await request(app).post("/auth/register").send(mockRegisterInput);

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Empty body => 400", async () => {
    const res = await request(app).post("/auth/register").send({});

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Wrong field type (username number) => 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send(buildRegisterInput({ username: 123 as any }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Wrong field type (password number) => 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send(buildRegisterInput({ password: 123 as any }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Empty username => 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send(buildRegisterInput({ username: "" }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Empty password => 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send(buildRegisterInput({ password: "" }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Large username (longer than maxLength) => 400", async () => {
    const longUsername = "u".repeat(500);

    const res = await request(app)
      .post("/auth/register")
      .send(buildRegisterInput({ username: longUsername }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Large password (longer than maxLength) => 400", async () => {
    const longPassword = "p".repeat(500);

    const res = await request(app)
      .post("/auth/register")
      .send(buildRegisterInput({ password: longPassword }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Duplicate username => 409", async () => {
    const fixedUsername = `dup_${Date.now()}`;
    const firstInput = buildRegisterInput({ username: fixedUsername });
    const secondInput = buildRegisterInput({ username: fixedUsername });

    const mockError = { code: "P2002" } as any;
    Object.setPrototypeOf(
      mockError,
      Prisma.PrismaClientKnownRequestError.prototype
    );
    
    (prismaClient.user.create as jest.Mock)
      .mockResolvedValueOnce(buildMockUserRecord())
      .mockRejectedValueOnce(mockError);

    const first = await request(app).post("/auth/register").send(firstInput);
    expect(first.status).toBe(201);

    const second = await request(app).post("/auth/register").send(secondInput);
    expect(second.status).toBe(409);
    expect(second.headers).toHaveProperty("x-trace-id");
  });

  test("Extra field is ignored or rejected", async () => {
    const input: any = buildRegisterInput();
    input.role = "ADMIN"; 

    const res = await request(app).post("/auth/register").send(input);

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });
});

describe("POST /auth/login", () => {
  test("Correct credentials => 201, login succeeds", async () => {
    const registerInput = buildRegisterInput();
    const registerRes = await request(app)
      .post("/auth/register")
      .send(registerInput);

    expect(registerRes.status).toBe(201);

    const loginInput = buildLoginInput({
      username: registerInput.username,
      password: "mockPassword",
    });

    const loginRes = await request(app)
      .post("/auth/login")
      .send(loginInput);

    expect(loginRes.status).toBe(200);
    expect(loginRes.headers).toHaveProperty("x-trace-id");
    expect(loginRes.body.sessionId).toEqual(expect.any(String));
  });

  test("Missing username => 400", async () => {
    const input: any = buildLoginInput();
    delete input.username;

    const res = await request(app).post("/auth/login").send(input);

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Missing password => 400", async () => {
    const input: any = buildLoginInput();
    delete input.password;

    const res = await request(app).post("/auth/login").send(input);

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Empty body => 400", async () => {
    const res = await request(app).post("/auth/login").send({});

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Wrong type (username number) => 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send(buildLoginInput({ username: 123 as any }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Wrong type (password number) => 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send(buildLoginInput({ password: 123 as any }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("User not found => 401", async () => {
    const input = buildLoginInput({
      username: `no_user_${Date.now()}`,
      password: "123123123",
    });

    const res = await request(app).post("/auth/login").send(input);

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Wrong password => 401", async () => {
    
    const registerInput = buildRegisterInput();
    const registerRes = await request(app)
      .post("/auth/register")
      .send(registerInput);
    expect(registerRes.status).toBe(201);

    
    const res = await request(app).post("/auth/login").send({
      username: registerInput.username,
      password: "wrong_password_123",
    });

    expect(res.status).toBe(401);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Large username (longer than maxLength) => 400", async () => {
    const longUsername = "u".repeat(500);

    const res = await request(app)
      .post("/auth/login")
      .send(buildLoginInput({ username: longUsername }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Large password (longer than maxLength) => 400", async () => {
    const longPassword = "p".repeat(500);

    const res = await request(app)
      .post("/auth/login")
      .send(buildLoginInput({ password: longPassword }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });
});