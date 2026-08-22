import { Request, Response, NextFunction } from 'express';
import { sessionService } from './session.service';
import '@api/core/context/tenant-context';

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      res.status(401).json({ error: 'Unauthorized', message: 'No access token provided' });
      return;
    }

    try {
      const decoded = sessionService.verifyAccessToken(accessToken);
      req.user = {
        userId: decoded.userId,
        sessionId: decoded.sessionId
      };
      next();
    } catch (jwtError) {
      // Token is invalid or expired
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired access token' });
      return;
    }
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication failed' });
    return;
  }
};
