import request from "supertest";
import { createApp } from "../../src/app";
import prisma from "../../src/db/prismaClient";
import { buildRegisterInput, buildRegisterOutput, buildLoginInput, } from "./mockData/auth.mock";

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
  // 1) POST /auth/register
    describe("POST /auth/register", () => {
      test("Correct input => 201, new user is created and id is returned", async () => {
        const mockRegisterInput = buildRegisterInput();
        const mockRegisterOutput = buildRegisterOutput();

        const res = await request(app).post("/auth/register").send(mockRegisterInput);

        expect(res.status).toBe(201);
        expect(res.headers).toHaveProperty("x-trace-id");
        expect(res.body).toMatchObject(mockRegisterOutput);

        // DB side-effect: user exists and password is hashed (not stored as plain text)
        const userId = res.body.id;              // string like "44"
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

      test("Duplicate username => 409 or 400 (depending on implementation)", async () => {
        const fixedUsername = `dup_${Date.now()}`;
        const firstInput = buildRegisterInput({ username: fixedUsername });
        const secondInput = buildRegisterInput({ username: fixedUsername });

        const first = await request(app).post("/auth/register").send(firstInput);
        expect(first.status).toBe(201);

        const second = await request(app).post("/auth/register").send(secondInput);
        expect([400, 409]).toContain(second.status);
        expect(second.headers).toHaveProperty("x-trace-id");
      });

      test("Extra field is ignored or rejected (depends on schema strictness)", async () => {
        const input: any = buildRegisterInput();
        input.role = "ADMIN"; // user tries privilege escalation

        const res = await request(app).post("/auth/register").send(input);

        // If Zod is .strict() => 400
        // If not strict => still 201 but role should NOT be set by client
        expect([201, 400]).toContain(res.status);
        expect(res.headers).toHaveProperty("x-trace-id");

        if (res.status === 201) {
          const dbUser = await prisma.user.findUnique({
            where: { username: input.username },
          });

          expect(dbUser).not.toBeNull();

          const roleValue = (dbUser as any).role;
          // Ensure user cannot set ADMIN via request body (role should be default)
          if (roleValue) {
            expect(roleValue).not.toBe("ADMIN");
          }
        }
      });
    });

      describe("POST /auth/login", () => {
      test("Correct credentials => 200 (or 201), login succeeds", async () => {
        // Arrange: register a user first
        const registerInput = buildRegisterInput();
        const registerRes = await request(app)
          .post("/auth/register")
          .send(registerInput);

        expect(registerRes.status).toBe(201);

        // Act: login with same credentials
        const loginInput = buildLoginInput({
          username: registerInput.username,
          password: registerInput.password,
        });

        const res = await request(app).post("/auth/login").send(loginInput);

        // Depending on your controller, login may return 200 or 201
        expect([200, 201]).toContain(res.status);
        expect(res.headers).toHaveProperty("x-trace-id");

        // ✅ We don't assume response fields yet.
        // But we can still assert that it returns an object.
        expect(typeof res.body).toBe("object");
        expect(res.body).not.toBeNull();
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

      test("User not found => 401 (or 404 depending on implementation)", async () => {
        const input = buildLoginInput({
          username: `no_user_${Date.now()}`,
          password: "123123123",
        });

        const res = await request(app).post("/auth/login").send(input);

        // Common behavior: 401 Unauthorized
        // Some implementations return 404
        expect([401, 404]).toContain(res.status);
        expect(res.headers).toHaveProperty("x-trace-id");
      });

      test("Wrong password => 401", async () => {
        // register
        const registerInput = buildRegisterInput();
        const registerRes = await request(app)
          .post("/auth/register")
          .send(registerInput);
        expect(registerRes.status).toBe(201);

        // login with wrong password
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

