
import * as authService from "../../../src/auth/authService";
import * as authController from "../../../src/auth/authController";
import { buildLoginOutput, buildRegisterInput, buildRegisterOutput } from "../../authMock";

let next: jest.Mock;
let jsonMock: jest.Mock;
let statusMock: jest.Mock;
let res: any;
const req: any = { validated: { body: { ...buildRegisterInput() } } };

beforeEach(() => {
  jest.clearAllMocks();
  next = jest.fn();
  jsonMock = jest.fn();
  statusMock = jest.fn(() => ({ json: jsonMock }));
  res = { status: statusMock };
});

describe("user register controller", () => {
  it("should call registerUser and return 201 with new user data", async () => {
    jest.spyOn(authService, "registerUser").mockResolvedValue(buildRegisterOutput());

    await authController.register(req, res, next);
    
    expect(authService.registerUser).toHaveBeenCalledWith(req.validated.body);
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(buildRegisterOutput());
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const error = new Error("Service encountered an error");
    jest.spyOn(authService, "registerUser").mockRejectedValue(error);

    await authController.register(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("user login controller", () => {
  it("should call loginUser and return 200 with jwt", async () => {
    jest.spyOn(authService, "loginUser").mockResolvedValue(buildLoginOutput());

    await authController.login(req, res, next);
    
    expect(authService.loginUser).toHaveBeenCalledWith(req.validated.body);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(buildLoginOutput());
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const error = new Error("Service encountered an error");
    jest.spyOn(authService, "loginUser").mockRejectedValue(error);

    await authController.login(req, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
