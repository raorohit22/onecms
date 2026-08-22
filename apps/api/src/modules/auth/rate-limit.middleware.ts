import { Request, Response, NextFunction } from 'express';

export const loginRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // stub
  next();
};
