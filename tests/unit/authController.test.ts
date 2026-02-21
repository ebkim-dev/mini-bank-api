
import * as authService from "../../src/auth/authService";
import * as authController from "../../src/auth/authController";
import { UserRole } from "../../src/generated/enums"

import {
  UserOutput,
} from "../../src/types/user";

let next: jest.Mock;
let jsonMock: jest.Mock;
let statusMock: jest.Mock;
let res: any;

const currentDate = new Date();
const mockUserOutput: UserOutput = {
  id: 42n,
  username: "mockUser",
  role: UserRole.ADMIN,
  created_at: currentDate,
  updated_at: currentDate,
};

beforeEach(() => {
  next = jest.fn();
  jsonMock = jest.fn();
  statusMock = jest.fn(() => ({ json: jsonMock }));
  res = { status: statusMock };
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});


describe("user register controller", () => {
  it("should call registerUser and return 201 with new user data", async () => {
    jest.spyOn(authService, "registerUser").mockResolvedValue(mockUserOutput);

    const req: any = {
      validated: { 
        body: { 
          username: "alice",
          password: "12345678"
        } 
      },
    };

    await authController.register(req, res, next);
    
    expect(authService.registerUser).toHaveBeenCalledWith(req.validated.body);
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(mockUserOutput);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const error = new Error("Service encountered an error");
    jest.spyOn(authService, "registerUser").mockRejectedValue(error);

    const req: any = {
      validated: {
        body: {
          username: "alice",
          password: "12345678"
        }
      },
    };

    await authController.register(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
