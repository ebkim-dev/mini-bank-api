import { buildUserRecord } from "../../authMock";
import { AppError } from "../../../src/error/error";
import { EventCode } from "../../../src/types/eventCodes";
import { ErrorMessages } from "../../../src/error/errorMessages";
import {
  mockPassword
} from "../../commonMock";
import {
  throwIfInvalidPassword,
  throwIfUserNotFound,
} from "../../../src/auth/authAssertions";

jest.mock("bcrypt", () => ({ compare: jest.fn() }));
import bcrypt from "bcrypt";

const mockCompare = bcrypt.compare as jest.Mock;

describe("throwIfUserNotFound", () => {
  it("does not throw if user exists", () => {
    const user = buildUserRecord();
    expect(() => throwIfUserNotFound(user)).not.toThrow();
  });

  it("throws generic Error if user is null", () => {
    try {
      throwIfUserNotFound(null);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      const error = err as AppError;
      expect(error.message).toBe(EventCode.USER_NOT_FOUND);
    }
  });
});

describe("throwIfInvalidPassword", () => {
  it("does not throw if password is correct", async () => {
    mockCompare.mockResolvedValue(true);
    const user = buildUserRecord();
    await expect(
      throwIfInvalidPassword(user, mockPassword)
    ).resolves.not.toThrow();
  });

  it("throws UnauthorizedError if password is wrong", async () => {
    mockCompare.mockResolvedValue(false);
    const user = buildUserRecord();
    
    await expect(
      throwIfInvalidPassword(user, "wrong " + mockPassword)
    ).rejects.toMatchObject({
      code: EventCode.INVALID_CREDENTIALS,
      message: ErrorMessages.INVALID_CREDENTIALS,
    });
  });
});
