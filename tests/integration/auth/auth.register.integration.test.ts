import request from "supertest";
import { createApp } from "../../../src/app";
import { Prisma } from "../../../src/generated/client";
import { RegisterInput } from "../../../src/auth/user";
import { mockCustomerId } from "../../commonMock";
import { 
  buildRegisterInput, 
  buildRegisterOutput,
  buildUserRecord, 
} from "../../authMock";

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

const mockUserCreate = jest.fn();
const mockCustomerCreate = jest.fn();
const mockTransaction = jest.fn(async (callback) => {
  return callback({
    user: { create: mockUserCreate },
    customer: { create: mockCustomerCreate },
  });
});

jest.mock("../../../src/db/prismaClient", () => ({
  __esModule: true,
  default: {
    $transaction: mockTransaction,
  },
}));
import prismaClient from "../../../src/db/prismaClient";

const app = createApp();

beforeEach(() => {
  jest.clearAllMocks();
  mockCustomerCreate.mockResolvedValue({
    id: mockCustomerId,
  });
  mockUserCreate.mockResolvedValue(buildUserRecord());
});

describe("POST /auth/register", () => {
  async function registerRequest(
    registerInput: Partial<RegisterInput> = {},
  ) {
    return request(app).post("/auth/register").send(registerInput);
  }

  test("Correct input => 201, new user is created and id is returned", async () => {
    const res = await registerRequest(buildRegisterInput());

    expect(res.status).toBe(201);
    expect(res.headers).toHaveProperty("x-trace-id");
    expect(res.body).toMatchObject(buildRegisterOutput());
    
  });

  test("Missing username => 400", async () => {
    const mockRegisterInput: any = buildRegisterInput();
    delete mockRegisterInput.username;

    const res = await registerRequest(mockRegisterInput);

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Missing password => 400", async () => {
    const mockRegisterInput: any = buildRegisterInput();
    delete mockRegisterInput.password;

    const res = await registerRequest(mockRegisterInput);

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Empty body => 400", async () => {
    const res = await registerRequest({});

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Wrong field type (username number) => 400", async () => {
    const res = await registerRequest(buildRegisterInput({ 
      username: 123 as any
    }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Wrong field type (password number) => 400", async () => {
    const res = await registerRequest(buildRegisterInput({ 
      password: 123 as any
    }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Empty username => 400", async () => {
    const res = await registerRequest(buildRegisterInput({ 
      username: ""
    }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Empty password => 400", async () => {
    const res = await registerRequest(buildRegisterInput({ 
      password: ""
    }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Large username (longer than maxLength) => 400", async () => {
    const longUsername = "u".repeat(500);
    const res = await registerRequest(buildRegisterInput({ 
      username: longUsername
    }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Large password (longer than maxLength) => 400", async () => {
    const longPassword = "p".repeat(500);
    const res = await registerRequest(buildRegisterInput({ 
      password: longPassword
    }));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });

  test("Duplicate username => 409", async () => {
    const mockError = { code: "P2002" } as any;
    Object.setPrototypeOf(
      mockError,
      Prisma.PrismaClientKnownRequestError.prototype
    );
    
    mockCreate
      .mockResolvedValueOnce(buildUserRecord())
      .mockRejectedValueOnce(mockError);

    const fixedUsername = `dup_${Date.now()}`;
    const res1 = await registerRequest(buildRegisterInput({ 
      username: fixedUsername
    }));
    const res2 = await registerRequest(buildRegisterInput({ 
      username: fixedUsername
    }));

    expect(res1.status).toBe(201);
    expect(res1.headers).toHaveProperty("x-trace-id");
    expect(res2.status).toBe(409);
    expect(res2.headers).toHaveProperty("x-trace-id");
  });

  test("Extra field is ignored or rejected", async () => {
    const res = await registerRequest(buildRegisterInput({ 
      foo: "bar"
    } as any));

    expect(res.status).toBe(400);
    expect(res.headers).toHaveProperty("x-trace-id");
  });
});