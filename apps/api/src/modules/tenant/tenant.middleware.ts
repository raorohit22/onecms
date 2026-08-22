import { Request, Response, NextFunction } from 'express';
import { Membership, Organization, Role } from '@onecms/db';
import mongoose from 'mongoose';
import '@api/core/context/tenant-context';
import { logger } from '@api/core/logger/logger';

export const requireOrganizationContext = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      return;
    }

    const organizationId = req.headers['x-organization-id'] as string;
    
    if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) {
      res.status(403).json({ error: 'Forbidden', message: 'Missing or invalid X-Organization-Id header' });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(req.user.userId);
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    // 1. Verify organization exists and is active
    const org = await Organization.findOne({
      _id: orgObjectId,
      $or: [{ status: 'ACTIVE' }, { status: { $exists: false } }]
    });

    if (!org) {
      res.status(403).json({ error: 'Forbidden', message: 'Organization not found or inactive' });
      return;
    }

    // 2. Verify membership exists and is active
    const membership = await Membership.findOne({ 
      userId: userObjectId, 
      organizationId: orgObjectId,
      $or: [{ status: 'ACTIVE' }, { status: { $exists: false } }]
    });

    if (!membership) {
      logger.warn({ userId: req.user.userId, organizationId }, '[Tenant Middleware] Membership not found');
      res.status(403).json({ error: 'Forbidden', message: 'Not a member of this organization' });
      return;
    }

    let roleIds = (membership.roleIds || []).map((id: any) => id.toString());

    // 3. Fallback: If membership has no roles attached, resolve default organization Admin or Global role
    if (roleIds.length === 0) {
      const defaultRole = await Role.findOne({
        $or: [
          { organizationId: org._id, isSystem: true },
          { scope: 'GLOBAL', isSystem: true }
        ]
      });
      if (defaultRole) {
        roleIds = [defaultRole._id.toString()];
      }
    }

    req.tenant = {
      organizationId: org._id.toString(),
      membershipId: membership._id.toString(),
      roleIds
    };

    next();
  } catch (error) {
    logger.error({ err: error }, '[Tenant Middleware] Failed to establish tenant context');
    res.status(403).json({ error: 'Forbidden', message: 'Failed to establish tenant context' });
    return;
  }
};
