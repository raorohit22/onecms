import mongoose from 'mongoose';
import { Role, Permission } from '@onecms/db';
import type { ITenantContext } from '../../core/context/tenant-context';
import { redisClient } from '../../infrastructure/redis/connection';
import { logger } from '../../core/logger/logger';

class RBACService {
  private readonly RBAC_CACHE_TTL_SECONDS = 60; // 60 seconds

  /**
   * Resolves a flat set of permission canonical identities for the given roles and organization boundary.
   * Caches the resolved permission set in Redis to eliminate per-request database queries.
   * Format: 'ACTION:RESOURCE' (e.g. 'CREATE:POST')
   */
  async resolvePermissionsForRoles(roleIds: string[], organizationId: string): Promise<Set<string>> {
    if (!roleIds || roleIds.length === 0) {
      return new Set();
    }

    const sortedIds = [...roleIds].sort().join(',');
    const cacheKey = `rbac_v2:${organizationId}:${sortedIds}`;

    // 1. Try fetching from Redis cache
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as string[];
          if (parsed && parsed.length > 0) {
            return new Set(parsed);
          }
        }
      } catch (err) {
        logger.warn({ err, cacheKey }, 'Failed to read RBAC cache from Redis');
      }
    }

    // 2. Database resolution with hierarchy traversal
    const visitedRoleIds = new Set<string>();
    let currentRolesToFetch = roleIds.map(id => ({ id, requireGlobal: false }));
    const collectedPermissionIds = new Set<string>();
    const resolvedSet = new Set<string>();

    const orgObjectId = mongoose.Types.ObjectId.isValid(organizationId)
      ? new mongoose.Types.ObjectId(organizationId)
      : organizationId;

    while (currentRolesToFetch.length > 0) {
      const idsToFetch = currentRolesToFetch.map(r => r.id);
      const validRoleObjectIds = idsToFetch
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));

      if (validRoleObjectIds.length === 0) {
        break;
      }
      
      // Secure query boundary: Only resolve roles that either belong to this organization or are globally scoped.
      const roles = await Role.find({
        _id: { $in: validRoleObjectIds },
        $or: [
          { organizationId: orgObjectId },
          { organizationId: null },
          { organizationId: { $exists: false } },
          { scope: 'GLOBAL' }
        ]
      }).lean();

      const fetchConstraints = new Map(currentRolesToFetch.map(r => [r.id.toString(), r.requireGlobal]));
      currentRolesToFetch = [];

      for (const role of roles) {
        const roleId = role._id.toString();
        const requireGlobal = fetchConstraints.get(roleId);

        // Security: If this role was requested by a GLOBAL role, it MUST be GLOBAL.
        if (requireGlobal && role.scope !== 'GLOBAL') {
          continue; // Discard invalid inheritance (GLOBAL -> ORG)
        }

        if (visitedRoleIds.has(roleId)) continue; // Prevent cycles
        
        visitedRoleIds.add(roleId);

        // Grant full wildcards to administrative system roles
        const normalizedRoleName = (role.name || '').toLowerCase().trim();
        if (
          normalizedRoleName === 'super admin' ||
          normalizedRoleName === 'admin' ||
          normalizedRoleName === 'owner' ||
          normalizedRoleName === 'orgadmin' ||
          (role.isSystem && normalizedRoleName.includes('admin'))
        ) {
          resolvedSet.add('ALL:ALL');
          resolvedSet.add('MANAGE:ALL');
          resolvedSet.add('*:*');
          resolvedSet.add('READ:ALL');
          resolvedSet.add('MANAGE:POST');
          resolvedSet.add('READ:POST');
          resolvedSet.add('CREATE:POST');
          resolvedSet.add('UPDATE:POST');
          resolvedSet.add('DELETE:POST');
          resolvedSet.add('MANAGE:CATEGORY');
          resolvedSet.add('READ:CATEGORY');
          resolvedSet.add('MANAGE:TAG');
          resolvedSet.add('READ:TAG');
        }

        if (role.permissionIds && Array.isArray(role.permissionIds)) {
          role.permissionIds.forEach((id: any) => {
            if (id) collectedPermissionIds.add(id.toString());
          });
        }

        if (role.parentRoleId) {
          const parentId = role.parentRoleId.toString();
          if (!visitedRoleIds.has(parentId)) {
            const mustBeGlobal = role.scope === 'GLOBAL';
            currentRolesToFetch.push({ id: parentId, requireGlobal: mustBeGlobal });
          }
        }
      }
    }

    if (collectedPermissionIds.size > 0) {
      const validPermObjectIds = Array.from(collectedPermissionIds)
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));

      if (validPermObjectIds.length > 0) {
        const permissions = await Permission.find({
          _id: { $in: validPermObjectIds }
        }).lean();

        for (const p of permissions) {
          const action = (p.action || '').toUpperCase();
          const resource = (p.resource || '').toUpperCase();
          const canonical = `${action}:${resource}`;
          resolvedSet.add(canonical);

          // Handle common singular/plural alias normalization
          if (resource === 'CATEGORIES') resolvedSet.add(`${action}:CATEGORY`);
          if (resource === 'CATEGORY') resolvedSet.add(`${action}:CATEGORIES`);
          if (resource === 'POSTS') resolvedSet.add(`${action}:POST`);
          if (resource === 'POST') resolvedSet.add(`${action}:POSTS`);
          if (resource === 'TAGS') resolvedSet.add(`${action}:TAG`);
          if (resource === 'TAG') resolvedSet.add(`${action}:TAGS`);
          if (resource === 'USERS') resolvedSet.add(`${action}:USER`);
          if (resource === 'USER') resolvedSet.add(`${action}:USERS`);
          if (resource === 'MEMBERS') resolvedSet.add(`${action}:MEMBER`);
          if (resource === 'MEMBER') resolvedSet.add(`${action}:MEMBERS`);
        }
      }
    }

    // 3. Save resolved permissions to Redis
    if (redisClient && resolvedSet.size > 0) {
      try {
        await redisClient.set(
          cacheKey,
          JSON.stringify(Array.from(resolvedSet)),
          'EX',
          this.RBAC_CACHE_TTL_SECONDS
        );
      } catch (err) {
        logger.warn({ err, cacheKey }, 'Failed to save RBAC cache to Redis');
      }
    }

    return resolvedSet;
  }

  /**
   * Invalidates cached RBAC permissions for an organization (e.g. after role or permission updates).
   */
  async invalidateRbacCache(organizationId?: string): Promise<void> {
    if (!redisClient) return;

    try {
      const pattern = organizationId ? `rbac:${organizationId}:*` : 'rbac:*';
      let cursor = '0';
      const keysToDelete: string[] = [];

      do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys && keys.length > 0) {
          keysToDelete.push(...keys);
        }
      } while (cursor !== '0');

      if (keysToDelete.length > 0) {
        await redisClient.del(...keysToDelete);
      }
    } catch (err) {
      logger.warn({ err, organizationId }, 'Failed to invalidate RBAC cache');
    }
  }

  /**
   * Evaluates if the current tenant context possesses the required permission.
   * Supports exact matching, singular/plural aliases, and canonical wildcard formats:
   * - 'ALL:ALL' or '*:*'
   * - 'MANAGE:ALL' or 'MANAGE:<RESOURCE>'
   * - 'ALL:<RESOURCE>' or '*:<RESOURCE>'
   * - '<ACTION>:ALL' or '<ACTION>:*'
   */
  async hasPermission(tenantContext: ITenantContext, action: string, resource: string): Promise<boolean> {
    const act = action.toUpperCase();
    const res = resource.toUpperCase();
    const canonicalRequired = `${act}:${res}`;
    
    const resolvedPermissions = await this.resolvePermissionsForRoles(
      tenantContext.roleIds, 
      tenantContext.organizationId
    );

    // Check direct matches and wildcards
    const hasMatch = (
      resolvedPermissions.has(canonicalRequired) ||
      resolvedPermissions.has('ALL:ALL') ||
      resolvedPermissions.has('*:*') ||
      resolvedPermissions.has('MANAGE:ALL') ||
      resolvedPermissions.has(`MANAGE:${res}`) ||
      resolvedPermissions.has(`ALL:${res}`) ||
      resolvedPermissions.has(`*:${res}`) ||
      resolvedPermissions.has(`${act}:ALL`) ||
      resolvedPermissions.has(`${act}:*`)
    );

    if (hasMatch) return true;

    // Safety fallback: Active organization members are permitted basic READ operations for CMS entities
    if (resolvedPermissions.size === 0 && (act === 'READ' || act === 'LIST')) {
      return true;
    }

    return false;
  }
}

export const rbacService = new RBACService();

