import type { RequestHandler } from "express";
import { accountIdParamsSchema } from "../../../src/account/accountSchemas";
import {
  createTransferBodySchema,
  getTransferParamsSchema,
  getTransfersQuerySchema,
} from "../../../src/transfer/transferSchemas";

let postMock: jest.Mock;
let getMock: jest.Mock;

let mockCreateTransfer: jest.Mock;
let mockGetTransfer: jest.Mock;
let mockGetTransfers: jest.Mock;

let requireAuthMock: jest.Mock;
let validateMock: jest.Mock;

const makeMw = (): RequestHandler => 
  (_req, _res, next) => next();

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  postMock = jest.fn();
  getMock = jest.fn();

  mockCreateTransfer = jest.fn();
  mockGetTransfer = jest.fn();
  mockGetTransfers = jest.fn();

  requireAuthMock = jest.fn(() => makeMw());
  validateMock = jest.fn((schema, source) => makeMw());

  jest.doMock("express", () => {
    return {
      Router: () => ({
        post: postMock,
        get: getMock,
      }),
    };
  });

  jest.doMock("../../../src/transfer/transferController", () => {
    return {
      createTransfer: mockCreateTransfer,
      getTransfer: mockGetTransfer,
      getTransfers: mockGetTransfers,
    };
  });

  jest.doMock("../../../src/middleware/validationMiddleware", () => {
    return {
      validate: validateMock,
    };
  });

  jest.doMock("../../../src/auth/authMiddleware", () => {
    return {
      requireAuth: requireAuthMock,
    };
  });

  require("../../../src/transfer/transferRouter");
});

const findCall = (mockFn: jest.Mock, path: string) => {
  return mockFn.mock.calls.find((c: any[]) => c[0] === path);
};

test("registers POST / with correct middlewares and handler (createTransfer)", () => {
  const call = findCall(postMock, "/");
  expect(call).toBeDefined();

  const [
    path,
    requireAuthMw,
    validateParamsMw,
    validateBodyMw,
    handler
  ] = call;

  expect(path).toBe("/");
  expect(typeof requireAuthMw).toBe("function");
  expect(typeof validateParamsMw).toBe("function");
  expect(typeof validateBodyMw).toBe("function");
  expect(handler).toBe(mockCreateTransfer);

  expect(validateMock).toHaveBeenCalledWith(expect.any(Object), "body");
});

test("registers GET /:transferId with correct middlewares and handler (getTransfer)", () => {
  const call = findCall(getMock, "/:transferId");
  expect(call).toBeDefined();

  const [
    path,
    requireAuthMw,
    validateMw,
    handler
  ] = call;

  expect(path).toBe("/:transferId");
  expect(typeof requireAuthMw).toBe("function");
  expect(typeof validateMw).toBe("function");
  expect(handler).toBe(mockGetTransfer);

  expect(validateMock).toHaveBeenCalledWith(expect.any(Object), "params");
});

test("registers GET / with correct middlewares and handler (getTransfers)", () => {
  const call = findCall(getMock, "/");
  expect(call).toBeDefined();

  const [
    path,
    requireAuthMw,
    validateParamsMw,
    validateQueryMw,
    handler
  ] = call;

  expect(path).toBe("/");
  expect(typeof requireAuthMw).toBe("function");
  expect(typeof validateParamsMw).toBe("function");
  expect(typeof validateQueryMw).toBe("function");
  expect(handler).toBe(mockGetTransfers);

  expect(validateMock).toHaveBeenCalledWith(expect.any(Object), "params");
  expect(validateMock).toHaveBeenCalledWith(expect.any(Object), "query");
});