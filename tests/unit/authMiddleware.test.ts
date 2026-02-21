
import * as authMiddleware from "../../src/auth/authMiddleware";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

// let next: jest.Mock;
// let res: any;

beforeEach(() => {
  // next = jest.fn();
  // res = {};
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe("requireAuth middleware", () => {
  it("should not throw any errors given valid and fresh JWT", async () => {
    const mockedToken = {
      userId: "123",
      role: "ADMIN"
    };

    const mockedVerify = jwt.verify as jest.Mock;
    mockedVerify.mockImplementation(() => (mockedToken));

    const req: any = {
      headers: {
        authorization: "Bearer <mockedToken>"
      }
    };

    const res: any = {};
    const next = jest.fn();

    const middleware = authMiddleware.requireAuth();
    await middleware(req, res, next);
    expect(req.user).toEqual(mockedToken);
    expect(next).toHaveBeenCalledTimes(1);
  });
});