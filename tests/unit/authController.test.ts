
import * as authService from "../../src/auth/authService";
import * as authController from "../../src/auth/authController";
import {
  LoginOutput,
  RegisterInput,
  RegisterOutput,
} from "../../src/auth/user";

const mockRegisterInput: RegisterInput = {
  username: "alice",
  password: "12345678"
}
const mockRegisterOutput: RegisterOutput = {
  id: 42n.toString(),
};
const mockLoginOutput: LoginOutput = {
  token: "my_json_web_token",
  expiresIn: authService.JWT_EXPIRES_IN,
};

let next: jest.Mock;
let jsonMock: jest.Mock;
let statusMock: jest.Mock;
let res: any;
const req: any = { validated: { body: { ...mockRegisterInput } } };

beforeEach(() => {
  next = jest.fn();
  jsonMock = jest.fn();
  statusMock = jest.fn(() => ({ json: jsonMock }));
  res = { status: statusMock };
});

afterEach(() => {
  jest.resetAllMocks();
});


describe("user register controller", () => {
  it("should call registerUser and return 201 with new user data", async () => {
    jest.spyOn(authService, "registerUser").mockResolvedValue(mockRegisterOutput);

    await authController.register(req, res, next);
    
    expect(authService.registerUser).toHaveBeenCalledWith(req.validated.body);
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(mockRegisterOutput);
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
    jest.spyOn(authService, "loginUser").mockResolvedValue(mockLoginOutput);

    await authController.login(req, res, next);
    
    expect(authService.loginUser).toHaveBeenCalledWith(req.validated.body);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(mockLoginOutput);
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
