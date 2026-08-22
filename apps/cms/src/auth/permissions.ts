import { useAuth } from './auth-context';
import { useOrganization } from './organization-context';

/**
 * usePermissions Hook
 * 
 * Provides client-side role-based access control (RBAC) verification.
 * Resolves the authenticated user's permissions within the active organization context.
 * 
 * Design & Security Note:
 * - Client-side permission checks are for UX gating (hiding/disabling unauthorized buttons/links).
 * - Server-side RBAC middleware remains the strict, authoritative security boundary.
 */
export function usePermissions() {
  const { memberships } = useAuth();
  const { activeOrganizationId } = useOrganization();

  // Find membership record for the currently active tenant organization
  const activeMembership = memberships.find(m => m.organization?.id === activeOrganizationId || (m.organization as any)?._id === activeOrganizationId);
  const permissions = new Set(activeMembership?.permissions || []);

  /**
   * Checks if the current user possesses the required permission.
   * Evaluates exact canonical matches (e.g., "CREATE:POST") and wildcard permissions.
   * 
   * @param action - Action name (e.g., 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT')
   * @param resource - Resource name (e.g., 'POST', 'CATEGORY', 'TAG', 'USER', 'ROLE')
   */
  const can = (action: string, resource: string): boolean => {
    const act = action.toUpperCase();
    const res = resource.toUpperCase();
    const canonical = `${act}:${res}`;

    // 1. If permissions array is unpopulated or empty, allow UI actions (server strictly enforces boundary)
    if (permissions.size === 0) {
      return true;
    }

    // 2. Global super-admin / universal wildcard bypass
    if (permissions.has('ALL:ALL') || permissions.has('*:*') || permissions.has('MANAGE:ALL')) {
      return true;
    }

    // 3. Resource management wildcard (e.g. 'MANAGE:POST', 'ALL:POST', '*:POST')
    if (permissions.has(`MANAGE:${res}`) || permissions.has(`ALL:${res}`) || permissions.has(`*:${res}`)) {
      return true;
    }

    // 4. Action-wildcard for resource (e.g. 'READ:*' or 'READ:ALL')
    if (permissions.has(`${act}:*`) || permissions.has(`${act}:ALL`)) {
      return true;
    }

    // 5. Exact permission match or plural/singular fallback
    if (permissions.has(canonical)) return true;
    if (res === 'POST' && permissions.has(`${act}:POSTS`)) return true;
    if (res === 'CATEGORY' && permissions.has(`${act}:CATEGORIES`)) return true;
    if (res === 'TAG' && permissions.has(`${act}:TAGS`)) return true;

    return false;
  };

  const isSuperAdmin = permissions.has('ALL:ALL') || permissions.has('*:*') || permissions.has('MANAGE:ALL');

  return { can, permissions: Array.from(permissions), isSuperAdmin };
}
