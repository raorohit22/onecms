/**
 * Base Application Error.
 * Standardizes HTTP status codes, error codes, and optional error details across oneCMS.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request Error
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

/**
 * 400 Validation Error
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

/**
 * 401 Unauthorized Error (Authentication required / failed)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', details?: unknown) {
    super(401, 'UNAUTHORIZED', message, details);
  }
}

/**
 * 403 Forbidden Error (Authorization / RBAC / Tenant boundary denial)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden', details?: unknown) {
    super(403, 'FORBIDDEN', message, details);
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(resourceOrMessage: string = 'Resource not found', details?: unknown) {
    const message = resourceOrMessage.includes(' ') ? resourceOrMessage : `${resourceOrMessage} not found`;
    super(404, 'NOT_FOUND', message, details);
  }
}

/**
 * 409 Conflict Error (Duplicate slug, unique constraint violation)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: unknown) {
    super(409, 'CONFLICT', message, details);
  }
}

/**
 * 429 Rate Limit Exceeded Error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later', details?: unknown) {
    super(429, 'RATE_LIMIT_EXCEEDED', message, details);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'An unexpected internal error occurred', details?: unknown) {
    super(500, 'INTERNAL_SERVER_ERROR', message, details);
  }
}
