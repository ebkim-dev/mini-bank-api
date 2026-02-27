import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from "../../../src/error/error";

import { EventCode } from "../../../src/types/eventCodes";

describe("error.ts", () => {
  test("AppError sets fields + keeps prototype chain (instanceof works)", () => {
    const err = new AppError(418, "TEAPOT", "I am a teapot", { a: 1 });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);

    expect(err.statusCode).toBe(418);
    expect(err.code).toBe("TEAPOT");
    expect(err.message).toBe("I am a teapot");
    expect(err.details).toEqual({ a: 1 });
  });

  test("BadRequestError returns 400 AppError", () => {
    const err = BadRequestError("VALIDATION_ERROR", "bad request", { x: true });

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toBe("bad request");
    expect(err.details).toEqual({ x: true });
  });

  test("UnauthorizedError returns 401 AppError", () => {
    const err = UnauthorizedError("AUTH_REQUIRED", "unauthorized");

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("AUTH_REQUIRED");
    expect(err.message).toBe("unauthorized");
    expect(err.details).toBeUndefined();
  });

  test("ForbiddenError returns 403 AppError", () => {
    const err = ForbiddenError("FORBIDDEN", "forbidden", { reason: "role" });

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
    expect(err.message).toBe("forbidden");
    expect(err.details).toEqual({ reason: "role" });
  });

  test("NotFoundError returns 404 AppError", () => {
    const err = NotFoundError("NOT_FOUND", "missing", { id: 10 });

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("missing");
    expect(err.details).toEqual({ id: 10 });
  });

  test("ConflictError returns 409 AppError", () => {
    const err = ConflictError("CONFLICT", "duplicate", { field: "email" });

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
    expect(err.message).toBe("duplicate");
    expect(err.details).toEqual({ field: "email" });
  });

  test("InternalServerError uses default message when none provided", () => {
    const err = InternalServerError();

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe(EventCode.INTERNAL_SERVER_ERROR);
    expect(err.message).toBe("Something went wrong"); 
    expect(err.details).toBeUndefined();
  });

  test("InternalServerError uses custom message + details", () => {
    const err = InternalServerError("DB down", { service: "mysql" });

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe(EventCode.INTERNAL_SERVER_ERROR);
    expect(err.message).toBe("DB down");
    expect(err.details).toEqual({ service: "mysql" });
  });
});