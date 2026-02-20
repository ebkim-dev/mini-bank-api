
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const BadRequestError = (
  code: string,
  message: string,
  details?: unknown
): AppError => {
  return new AppError(400, code, message, details);
};

export const UnauthorizedError = (
  code: string,
  message: string,
  details?: unknown
): AppError => {
  return new AppError(401, code, message, details);
};

export const NotFoundError = (
  code: string,
  message: string,
  details?: unknown
): AppError => {
  return new AppError(404, code, message, details);
};

export const ConflictError = (
  code: string,
  message: string,
  details?: unknown
): AppError => {
  return new AppError(409, code, message, details);
};

export const InternalServerError = (
  message = "Something went wrong",
  details?: unknown
): AppError => {
  return new AppError(500, "INTERNAL_SERVER_ERROR", message, details);
};
