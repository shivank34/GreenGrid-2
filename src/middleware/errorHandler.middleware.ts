import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): Response => {
  // 1. Known AppError instance
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[AppError 500] ${err.message}`, { stack: err.stack, details: err.details });
    }
    return ApiResponse.error(res, err.message, err.statusCode, err.code, err.details);
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      rule: e.code,
    }));
    return ApiResponse.error(
      res,
      'Validation failed for incoming request data',
      400,
      'VALIDATION_ERROR',
      formattedErrors
    );
  }

  // 3. JWT Token Errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid authentication token', 401, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Authentication token has expired', 401, 'TOKEN_EXPIRED');
  }

  // 4. Malformed JSON Body
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    return ApiResponse.error(res, 'Malformed JSON payload in request body', 400, 'MALFORMED_JSON');
  }

  // 5. Prisma Database Errors (detected by code property)
  const prismaError = err as { code?: string; meta?: Record<string, unknown> };
  if (prismaError.code === 'P2002') {
    const target = (prismaError.meta?.target as string[]) || 'resource';
    return ApiResponse.error(
      res,
      `A unique constraint violation occurred on: ${Array.isArray(target) ? target.join(', ') : target}`,
      409,
      'DUPLICATE_RESOURCE'
    );
  }
  if (prismaError.code === 'P2025') {
    return ApiResponse.error(res, 'The requested database record does not exist', 404, 'RECORD_NOT_FOUND');
  }

  // 6. Generic Unhandled Internal Server Errors
  logger.error(`[Unhandled Exception]: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  const message = env.NODE_ENV === 'production' 
    ? 'An unexpected internal server error occurred' 
    : err.message || 'Internal Server Error';

  return ApiResponse.error(res, message, 500, 'INTERNAL_SERVER_ERROR');
};
