import request from "supertest";
import { createApp } from "../../src/app";
import prisma from "../../src/db/prismaClient";
import { buildRegisterInput, buildRegisterOutput, buildLoginInput, buildLoginOutput, } from "./mockData/auth.mock";

const app = createApp();

describe("Auth integration", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });


  describe("Auth integration", () => {
    describe("POST /auth/register", () => {
      test("Correct input => 201, new user is created and id is returned", async () => {
        const mockRegisterInput = buildRegisterInput();
        const mockRegisterOutput = buildRegisterOutput();

        const res = await request(app).post("/auth/register").send(mockRegisterInput);

        expect(res.status).toBe(201);
        expect(res.headers).toHaveProperty("x-trace-id");
        expect(res.body).toMatchObject(mockRegisterOutput);

        
        const userId = res.body.id;             
        const dbUser = await prisma.user.findUnique({
          where: { id: BigInt(userId) },
        });

        expect(dbUser).not.toBeNull();
        expect(dbUser!.username).toBe(mockRegisterInput.username);
        expect(dbUser!.password_hash).not.toBe(mockRegisterInput.password);
        expect(dbUser!.password_hash.length).toBeGreaterThan(10);
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
          password: registerInput.password,
        });

        const res = await request(app).post("/auth/login").send(loginInput);

        
        expect(res.status).toBe(200);
        expect(res.headers).toHaveProperty("x-trace-id");
        expect(res.body).toMatchObject(buildLoginOutput());
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
  });
});

