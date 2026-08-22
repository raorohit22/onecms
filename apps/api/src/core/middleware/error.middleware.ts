import { Request, Response, NextFunction } from 'express';
import { AppError } from '@api/core/errors/AppError';
import { env } from '@api/config/env';
import { logger } from '@api/core/logger/logger';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
    
    // Log client errors as info/warn, server errors as error
    if (statusCode >= 500) {
      logger.error({ err }, 'Application Error');
    }
  } else if ('status' in err && typeof err.status === 'number') {
    statusCode = err.status;
    code = 'BAD_REQUEST';
    message = err.message;
  } else {
    // Log unexpected errors heavily
    logger.error({ err }, 'Unhandled exception');
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
  });
}
