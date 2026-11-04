export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    details: unknown = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details: unknown = []) {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED', details: unknown = []) {
    return new AppError(message, 401, code, details);
  }

  static forbidden(message = 'You do not have permission to perform this action', code = 'FORBIDDEN', details: unknown = []) {
    return new AppError(message, 403, code, details);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND', details: unknown = []) {
    return new AppError(message, 404, code, details);
  }

  static conflict(message: string, code = 'CONFLICT', details: unknown = []) {
    return new AppError(message, 409, code, details);
  }

  static unprocessable(message = 'Unprocessable entity', code = 'UNPROCESSABLE_ENTITY', details: unknown = []) {
    return new AppError(message, 422, code, details);
  }

  static tooManyRequests(message = 'Too many requests, please try again later', code = 'TOO_MANY_REQUESTS') {
    return new AppError(message, 429, code);
  }

  static internal(message = 'An unexpected internal error occurred', code = 'INTERNAL_SERVER_ERROR') {
    return new AppError(message, 500, code);
  }
}
