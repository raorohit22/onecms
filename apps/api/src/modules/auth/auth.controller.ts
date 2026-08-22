import { Request, Response, NextFunction } from 'express';
import * as argon2 from 'argon2';
import { User, Membership } from '@onecms/db';
import { sessionService } from './session.service';
import { AppError } from '@api/core/errors/AppError';
import { rbacService } from './rbac.service';

export const authController = {
  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Email and password required');
      }

      const user = await User.findOne({ email, status: 'ACTIVE' });
      if (!user) {
        throw new AppError(401, 'AUTH_FAILED', 'Invalid credentials');
      }

      const isValid = await argon2.verify(user.passwordHash, password);
      if (!isValid) {
        throw new AppError(401, 'AUTH_FAILED', 'Invalid credentials');
      }

      const sessionId = await sessionService.createSession(user._id.toString(), {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      const accessToken = sessionService.generateAccessToken(user._id.toString(), sessionId);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      };

      res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000 // 15 mins
      });

      res.cookie('refreshToken', sessionId, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error) {
      next(error);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new AppError(401, 'UNAUTHORIZED', 'No refresh token provided');
      }

      const session = await sessionService.getSession(refreshToken);
      if (!session || session.status !== 'ACTIVE') {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token');
      }

      await sessionService.updateLastSeen(refreshToken);
      const newAccessToken = sessionService.generateAccessToken(session.userId, session.sessionId);

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 15 * 60 * 1000 // 15 mins
      });

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },
  
  logout: async (req: Request, res: Response, next: NextFunction): Promise<void> => { 
    try {
      const refreshToken = req.cookies?.refreshToken;
      
      if (refreshToken) {
        await sessionService.revokeSession(refreshToken);
      }
      
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.status(200).json({ success: true });
    } catch(error) {
      next(error);
    }
  },

  logoutAll: async (req: Request, res: Response) => { res.json({ message: 'stub' }); },
  
  getMe: async (req: Request, res: Response, next: NextFunction): Promise<void> => { 
    try {
      const userContext = req.user;
      if (!userContext) {
        throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
      }

      const user = await User.findById(userContext.userId);
      if (!user) {
        throw new AppError(401, 'UNAUTHORIZED', 'User not found');
      }
      
      const memberships = await Membership.find({ userId: user._id, status: 'ACTIVE' }).populate('organizationId');
      
      const populatedMemberships = await Promise.all(
        memberships.map(async (m) => {
          if (!m.organizationId) return null;
          const orgId = (m.organizationId as any)._id.toString();
          const permissionsSet = await rbacService.resolvePermissionsForRoles(m.roleIds.map(id => id.toString()), orgId);
          return {
            id: m._id,
            roleIds: m.roleIds,
            permissions: Array.from(permissionsSet),
            organization: {
              id: orgId,
              name: (m.organizationId as any).name,
              slug: (m.organizationId as any).slug,
            }
          };
        })
      );
      
      res.status(200).json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        memberships: populatedMemberships.filter(m => m !== null)
      });
    } catch(error) {
      next(error);
    }
  },
  
  getSessions: async (req: Request, res: Response) => { res.json({ message: 'stub' }); },
  revokeSession: async (req: Request, res: Response) => { res.json({ message: 'stub' }); },
};
