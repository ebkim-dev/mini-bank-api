import type { RequestHandler } from "express";

describe("authRouter.ts", () => {
  let postMock: jest.Mock;

  let mockRegister: jest.Mock;
  let mockLogin: jest.Mock;

  let validateMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    postMock = jest.fn();

    mockRegister = jest.fn() as any;
    mockLogin = jest.fn() as any;

    validateMock = jest.fn(() => {
      const mw: RequestHandler = (_req, _res, next) => next();
      return mw;
    });

    jest.doMock("express", () => {
      return {
        Router: () => ({
          post: postMock
        })
      };
    });

    jest.doMock("../../../src/auth/authController", () => {
      return {
        register: mockRegister,
        login: mockLogin
      };
    });

    jest.doMock("../../../src/middleware/validationMiddleware", () => {
      return {
        validate: validateMock
      };
    });

    require("../../../src/auth/authRouter");
  });

  test("registers POST /register with validate(registerBodySchema,'body') then register controller", () => {
    
    const { registerBodySchema } = require("../../../src/auth/userSchemas");
    expect(validateMock).toHaveBeenCalledWith(registerBodySchema, "body");

    const registerCall = postMock.mock.calls.find((c: any[]) => c[0] === "/register");
    expect(registerCall).toBeDefined();

    const [path, mw, handler] = registerCall as any[];

    expect(path).toBe("/register");
    expect(typeof mw).toBe("function"); // middleware returns validate()
    expect(handler).toBe(mockRegister);
  });

  test("registers POST /login with validate(loginBodySchema,'body') then login controller", () => {
    const { loginBodySchema } = require("../../../src/auth/userSchemas");

    expect(validateMock).toHaveBeenCalledWith(loginBodySchema, "body");

    const loginCall = postMock.mock.calls.find((c: any[]) => c[0] === "/login");
    expect(loginCall).toBeDefined();

    const [path, mw, handler] = loginCall as any[];

    expect(path).toBe("/login");
    expect(typeof mw).toBe("function");
    expect(handler).toBe(mockLogin);
  });

  test("registers exactly two routes (register + login) and nothing else", () => {
    expect(postMock).toHaveBeenCalledTimes(2);

    const paths = postMock.mock.calls.map((c: any[]) => c[0]);
    expect(paths).toEqual(expect.arrayContaining(["/register", "/login"]));
  });

  test("uses the middleware retured by validate() for each route", () => {

    const registerCall = postMock.mock.calls.find((c: any[]) => c[0] === "/register");
    const loginCall = postMock.mock.calls.find((c: any[]) => c[0] === "/login");

    expect(registerCall).toBeDefined();
    expect(loginCall).toBeDefined();

    expect(validateMock).toHaveBeenCalledTimes(2);

    const firstReturnedMw = validateMock.mock.results[0]!.value; // middleware for /register
    const secondReturnedMw = validateMock.mock.results[1]!.value; // middleware for /login

    expect(registerCall![1]).toBe(firstReturnedMw);
    expect(loginCall![1]).toBe(secondReturnedMw);
  });
});