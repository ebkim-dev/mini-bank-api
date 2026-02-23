import request from "supertest";
import { createApp } from "../../src/app";
import prisma from "../../src/db/prismaClient";

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

  it("should register a user", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({
        username: "alice",
        password: "Password123!"
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

});
