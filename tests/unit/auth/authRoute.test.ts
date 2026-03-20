import type { RequestHandler } from "express";

let postMock: jest.Mock;
let getMock: jest.Mock;

let mockRegister: jest.Mock;
let mockLogin: jest.Mock;
let mockLogout: jest.Mock;
let mockMe: jest.Mock;

let validateMock: jest.Mock;
let requireAuthMock: jest.Mock;

const makeMw = (name: string): RequestHandler => {
  const mw: RequestHandler = (_req, _res, next) => next();
  (mw as any)._mwName = name;
  return mw;
};

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  postMock = jest.fn();
  getMock = jest.fn();

  mockRegister = jest.fn();
  mockLogin = jest.fn();
  mockLogout = jest.fn();
  mockMe = jest.fn();

  validateMock = jest.fn((_schema: unknown, _source: unknown) =>
    makeMw("validate")
  );
  requireAuthMock = jest.fn(() => makeMw("requireAuth"));

  jest.doMock("express", () => ({
    Router: () => ({ post: postMock, get: getMock }),
  }));

  jest.doMock("../../../src/auth/authController", () => ({
    register: mockRegister,
    login: mockLogin,
    logout: mockLogout,
    me: mockMe,
  }));

  jest.doMock("../../../src/middleware/validationMiddleware", () => ({
    validate: validateMock,
  }));

  jest.doMock("../../../src/auth/authMiddleware", () => ({
    requireAuth: requireAuthMock,
  }));

  require("../../../src/auth/authRouter");
});

const findCall = (mockFn: jest.Mock, path: string) =>
  mockFn.mock.calls.find((c: any[]) => c[0] === path);

test("registers POST /register with validate(registerBodySchema) then register handler", () => {
  const { registerBodySchema } = require("../../../src/auth/userSchemas");

  const call = findCall(postMock, "/register");
  expect(call).toBeDefined();

  const [path, mw, handler] = call as any[];

  expect(path).toBe("/register");
  expect(typeof mw).toBe("function");
  expect(handler).toBe(mockRegister);
  expect(validateMock).toHaveBeenCalledWith(registerBodySchema, "body");
});

test("registers POST /login with validate(loginBodySchema) then login handler", () => {
  const { loginBodySchema } = require("../../../src/auth/userSchemas");

  const call = findCall(postMock, "/login");
  expect(call).toBeDefined();

  const [path, mw, handler] = call as any[];

  expect(path).toBe("/login");
  expect(typeof mw).toBe("function");
  expect(handler).toBe(mockLogin);
  expect(validateMock).toHaveBeenCalledWith(loginBodySchema, "body");
});

test("registers POST /logout with requireAuth then logout handler — no validate middleware", () => {
  const call = findCall(postMock, "/logout");
  expect(call).toBeDefined();

  const [path, authMw, handler] = call as any[];

  expect(path).toBe("/logout");
  expect(typeof authMw).toBe("function");
  expect(handler).toBe(mockLogout);

  const requireAuthReturnedMw = requireAuthMock.mock.results[0]?.value;
  expect(authMw).toBe(requireAuthReturnedMw);

  const validateCallArgs = validateMock.mock.calls;
  expect(validateCallArgs.every(([, source]: any[]) => source !== "logout")).toBe(true);
});

test("registers GET /me with requireAuth then me handler — no validate middleware", () => {
  const call = findCall(getMock, "/me");
  expect(call).toBeDefined();

  const [path, authMw, handler] = call as any[];

  expect(path).toBe("/me");
  expect(typeof authMw).toBe("function");
  expect(handler).toBe(mockMe);


  const requireAuthReturnedMws = requireAuthMock.mock.results.map((r: any) => r.value);
  expect(requireAuthReturnedMws).toContain(authMw);

  const validateReturnedMws = validateMock.mock.results.map((r: any) => r.value);
  expect(validateReturnedMws).not.toContain(authMw);
});

test("registers exactly 3 POST routes and 1 GET route", () => {
  expect(postMock).toHaveBeenCalledTimes(3);
  expect(getMock).toHaveBeenCalledTimes(1);

  const postPaths = postMock.mock.calls.map((c: any[]) => c[0]);
  expect(postPaths).toEqual(
    expect.arrayContaining(["/register", "/login", "/logout"])
  );

  const getPaths = getMock.mock.calls.map((c: any[]) => c[0]);
  expect(getPaths).toEqual(expect.arrayContaining(["/me"]));
});

test("validate is called exactly twice — only for /register and /login", () => {
  const { registerBodySchema, loginBodySchema } = require("../../../src/auth/userSchemas");

  expect(validateMock).toHaveBeenCalledTimes(2);
  expect(validateMock).toHaveBeenCalledWith(registerBodySchema, "body");
  expect(validateMock).toHaveBeenCalledWith(loginBodySchema, "body");
});