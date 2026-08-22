# Tenant Isolation & Request Context

OneCMS is a multi-tenant platform utilizing a **Shared Database, Isolated Row** architecture. Isolation is rigorously enforced at the application tier.

## Core Concepts

1. **Global Identity (`User`)**: Users are global entities. They authenticate to the platform, not to a specific organization.
2. **Tenant (`Organization`)**: The primary security and billing boundary.
3. **Bridge (`Membership`)**: The relationship linking a `User` to an `Organization`.

## The `X-Organization-Id` Header

Because users can belong to multiple organizations, they must explicitly define the active context for API requests that interact with tenant-scoped resources.

- Clients must pass `X-Organization-Id` as an HTTP header for all protected API calls.
- In the frontend CMS, this is handled automatically via an Axios request interceptor (`apiClient.ts`) which reads the current organization ID from the `OrganizationContext`.
- The `tenant.middleware.ts` validates this header against the database to ensure the user has an active `Membership` in the specified organization.

## Request Context

If authentication and tenant resolution succeed, the Express Request object is populated with strongly-typed contexts:

```typescript
// req.user (IUserContext)
{
  userId: string;
  sessionId: string;
}

// req.tenant (ITenantContext)
{
  organizationId: string;
  membershipId: string;
  roleIds: string[];
}
```

## Security Semantics (Error Codes)

- **401 Unauthorized**: No session, invalid session, or expired token.
- **403 Forbidden**: Valid session, but missing `X-Organization-Id`, invalid format, or the user is not a member of the requested organization.
- **404 Not Found**: Resource doesn't exist, or it belongs to a *different* organization (never leak existence to unauthorized tenants).

## The Tenant Repository Abstraction

When fetching a tenant-scoped resource from the database, you **must never** use `Model.findById(id)` by itself, as a malicious user could pass the ID of a resource belonging to another organization.

Instead, always constrain queries using the tenant context:

```typescript
import { tenantRepository } from '@api/modules/tenant/tenant.repository';
import { Workspace } from '@onecms/db';

// SAFE: Enforces { _id: workspaceId, organizationId: req.tenant.organizationId }
const workspace = await tenantRepository.findById(Workspace, workspaceId, req.tenant);
```

For custom queries, use `withTenant`:

```typescript
const filter = tenantRepository.withTenant({ status: 'ACTIVE' }, req.tenant);
const activeWorkspaces = await Workspace.find(filter);
```
