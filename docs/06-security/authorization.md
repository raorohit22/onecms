# Authorization Security & RBAC

Permission checks must happen on the server.

Roles are convenience groupings of permissions. They can be Global (system-wide) or Organization-scoped.
Permissions define actual capabilities (e.g., `posts:create`, `users:delete`).

## RBAC Implementation

oneCMS uses a matrix-based Role-Based Access Control (RBAC) system:
1. **Permissions**: Seeded statically into the database (`Action` + `Resource`).
2. **Roles**: Groupings of permissions. Created by administrators.
3. **Memberships**: The bridge between a `User` and an `Organization`. A membership contains an array of `Role` IDs.

### Authorization Middleware (`requirePermission`)

The `requirePermission(action, resource)` middleware enforces access control before the controller logic executes:
1. It retrieves the user's `Membership` for the active `X-Organization-Id`.
2. It expands the membership's `roleIds` into a full list of granted permissions.
3. It checks if the required `action` + `resource` exists in that granted list.
4. If missing, it throws a `403 Forbidden` error.

### Object-level Authorization
Object-level authorization must be considered for owned content. Even if a user has `posts:edit`, they may only be allowed to edit posts where `authorId === req.user.userId` (unless they also have `posts:edit_any`).

Never trust:
- hidden buttons (the UI should hide them, but the server must still verify)
- client-side route guards (they are purely for UX, not security)
- client-supplied role identifiers (always derive roles securely from the server session/membership)
