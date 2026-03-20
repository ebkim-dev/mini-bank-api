import * as authService from "../../../src/auth/authService";
import * as authController from "../../../src/auth/authController";
import { buildAuthInput, buildLoginOutput, buildMeOutput, buildRegisterInput, buildRegisterOutput } from "../../authMock";
import { mockSessionId } from "../../commonMock";

let next: jest.Mock;
let jsonMock: jest.Mock;
let statusMock: jest.Mock;
let sendMock: jest.Mock;
let res: any;
const req: any = { validated: { body: { ...buildRegisterInput() } } };

beforeEach(() => {
  jest.clearAllMocks();
  next = jest.fn();
  jsonMock = jest.fn();
  sendMock = jest.fn();
  statusMock = jest.fn(() => ({ json: jsonMock, send: sendMock }));
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

describe("logout controller", () => {
  const logoutReq: any = {
    sessionId: mockSessionId,
    user: buildAuthInput(),
  };

  it("should call logoutUser and return 204 with no body", async () => {
    jest.spyOn(authService, "logoutUser").mockResolvedValue(undefined);

    await authController.logout(logoutReq, res, next);

    expect(authService.logoutUser).toHaveBeenCalledWith(
      mockSessionId,
      buildAuthInput()
    );
    expect(statusMock).toHaveBeenCalledWith(204);
    expect(sendMock).toHaveBeenCalledWith();
    expect(jsonMock).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const error = new Error("Service encountered an error");
    jest.spyOn(authService, "logoutUser").mockRejectedValue(error);

    await authController.logout(logoutReq, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("me controller", () => {
  const meReq: any = {
    user: buildAuthInput(),
  };

  it("should call fetchMe and return 200 with user profile", async () => {
    jest.spyOn(authService, "fetchMe").mockResolvedValue(buildMeOutput());

    await authController.me(meReq, res, next);

    expect(authService.fetchMe).toHaveBeenCalledWith(buildAuthInput());
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(buildMeOutput());
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next when service throws", async () => {
    const error = new Error("Service encountered an error");
    jest.spyOn(authService, "fetchMe").mockRejectedValue(error);

    await authController.me(meReq, res, next);

    expect(statusMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});