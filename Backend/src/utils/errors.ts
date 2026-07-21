/**
 * Typed application errors. Throw these from services/repositories and the
 * global error handler will convert them to the standard error response.
 */
import { HTTP_STATUS, MESSAGES } from '../constants';
import { ApiErrorResponse } from '../types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: ApiErrorResponse['errors'];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors: ApiErrorResponse['errors'] = [],
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(errors: ApiErrorResponse['errors'], message: string = MESSAGES.VALIDATION_FAILED) {
    super(message, HTTP_STATUS.BAD_REQUEST, errors);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors: ApiErrorResponse['errors'] = []) {
    super(message, HTTP_STATUS.BAD_REQUEST, errors);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = MESSAGES.NOT_FOUND) {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = MESSAGES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = MESSAGES.FORBIDDEN) {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

export class DuplicateError extends AppError {
  constructor(message: string = MESSAGES.DUPLICATE, errors: ApiErrorResponse['errors'] = []) {
    super(message, HTTP_STATUS.CONFLICT, errors);
  }
}
