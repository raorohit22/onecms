import { Request, Response, NextFunction } from 'express';
import { AppError } from '@api/core/errors/AppError';

export function notFoundMiddleware(req: Request, res: Response, next: NextFunction) {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
}
