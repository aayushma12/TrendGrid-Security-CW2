import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { error as errorResponse } from '../utils/response';
import { AppError, NotFoundError } from '../utils/errors';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { isProduction } from '../config/env';

/** Human-readable messages for Multer's upload-limit failure codes. */
const MULTER_ERROR_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: 'Uploaded file exceeds the maximum allowed size.',
  LIMIT_FILE_COUNT: 'Too many files uploaded.',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field in upload.',
};

/** 404 catch-all. Must be registered AFTER all routes. */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Global error handler — the single exit point for every failure.
 * Formats output to match workflowtunelling.md "Error Response".
 */
export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // Zod validation errors (thrown by validate middleware fallback)
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
    logger.warn(`Validation error at ${req.method} ${req.originalUrl}`);
    errorResponse(res, MESSAGES.VALIDATION_FAILED, HTTP_STATUS.BAD_REQUEST, details);
    return;
  }

  // Multer upload failures (file too large, too many files, wrong field) —
  // these are client mistakes, never a 500.
  if (err instanceof MulterError) {
    const message = MULTER_ERROR_MESSAGES[err.code] ?? 'File upload failed.';
    logger.warn(`${HTTP_STATUS.BAD_REQUEST} ${message} (${err.code}) at ${req.method} ${req.originalUrl}`);
    errorResponse(res, message, HTTP_STATUS.BAD_REQUEST, [{ field: err.field ?? 'file', message }]);
    return;
  }

  // Prisma known errors that escaped a repository pre-check (e.g. a unique
  // constraint lost to a race). Map to proper client-facing status codes —
  // per workflowtunelling.md these must never surface as 500s.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = Array.isArray(err.meta?.target) ? (err.meta.target as string[]).join(', ') : undefined;
      const message = fields ? `A record with this ${fields} already exists.` : MESSAGES.DUPLICATE;
      logger.warn(`${HTTP_STATUS.CONFLICT} ${message} at ${req.method} ${req.originalUrl}`);
      errorResponse(res, message, HTTP_STATUS.CONFLICT, fields ? [{ field: fields, message }] : []);
      return;
    }
    if (err.code === 'P2025') {
      logger.warn(`${HTTP_STATUS.NOT_FOUND} Record not found at ${req.method} ${req.originalUrl}`);
      errorResponse(res, MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      return;
    }
    if (err.code === 'P2003') {
      const message = 'Operation blocked by a related record.';
      logger.warn(`${HTTP_STATUS.CONFLICT} ${message} (FK) at ${req.method} ${req.originalUrl}`);
      errorResponse(res, message, HTTP_STATUS.CONFLICT);
      return;
    }
  }

  // Known application errors
  if (err instanceof AppError) {
    logger.warn(`${err.statusCode} ${err.message} at ${req.method} ${req.originalUrl}`);
    errorResponse(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Unknown errors — do NOT leak internals in production
  logger.error(`Unhandled error at ${req.method} ${req.originalUrl}`, {
    message: err.message,
    stack: err.stack,
  });

  errorResponse(
    res,
    isProduction ? MESSAGES.INTERNAL_ERROR : err.message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
};
