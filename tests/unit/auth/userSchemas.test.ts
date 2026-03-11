import {
  registerBodySchema,
  loginBodySchema,
} from "../../../src/auth/userSchemas";

describe("userSchemas.ts", () => {
  describe("registerBodySchema", () => {
    test("parses valid register body", () => {
      const parsed = registerBodySchema.parse({
        username: "srey123",
        password: "password123",
      });

      expect(parsed).toEqual({
        username: "srey123",
        password: "password123",
      });
    });

    test("rejects username shorter than 3", () => {
      expect(() =>
        registerBodySchema.parse({
          username: "ab",
          password: "password123",
        })
      ).toThrow();
    });

    test("rejects username longer than 32", () => {
      const longUsername = "a".repeat(33);

      expect(() =>
        registerBodySchema.parse({
          username: longUsername,
          password: "password123",
        })
      ).toThrow();
    });

    test("rejects password shorter than 8", () => {
      expect(() =>
        registerBodySchema.parse({
          username: "validuser",
          password: "short7",
        })
      ).toThrow();
    });

    test("rejects extra fields because of strict()", () => {
      expect(() =>
        registerBodySchema.parse({
          username: "validuser",
          password: "password123",
          extra: "nope",
        })
      ).toThrow();
    });
  });

  describe("loginBodySchema", () => {
    test("parses valid login body", () => {
      const parsed = loginBodySchema.parse({
        username: "user001",
        password: "password123",
      });

      expect(parsed.username).toBe("user001");
      expect(parsed.password).toBe("password123");
    });

    test("rejects missing required fields", () => {
      expect(() => loginBodySchema.parse({ username: "user001" })).toThrow();
      expect(() => loginBodySchema.parse({ password: "password123" })).toThrow();
    });

    test("rejects extra fields because of strict()", () => {
      expect(() =>
        loginBodySchema.parse({
          username: "user001",
          password: "password123",
          test: true,
        })
      ).toThrow();
    });
  });
});