import { Request, Response, NextFunction } from 'express';
import { rbacService } from './rbac.service';
import { logger } from '@api/core/logger/logger';

/**
 * Express middleware to enforce RBAC permissions.
 * MUST be applied AFTER requireOrganizationContext middleware.
 */
export const requirePermission = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenant) {
        // Developer error: middleware applied in wrong order
        res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'Tenant context missing. requirePermission must be used after requireOrganizationContext.' 
        });
        return;
      }

      const hasPerm = await rbacService.hasPermission(req.tenant, action, resource);
      
      if (!hasPerm) {
        res.status(403).json({ 
          error: 'Forbidden', 
          message: `Missing required permission: ${action.toUpperCase()}:${resource.toUpperCase()}` 
        });
        return;
      }

      next();
    } catch (error) {
      logger.error({ err: error, tenant: req.tenant, action, resource }, '[RBAC Middleware] Error resolving permissions');
      res.status(403).json({ error: 'Forbidden', message: 'Authorization check failed' });
      return;
    }
  };
};

