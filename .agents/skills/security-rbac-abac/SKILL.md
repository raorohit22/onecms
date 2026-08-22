---
name: security-rbac-abac
description: Security guidelines, RBAC, ABAC, and session constraints for oneCMS.
---

# Security, RBAC & ABAC

## Workflow
1. **Review Requirements:** Always read `@docs/06-security/security-architecture.md` before altering authorization paths.
2. **Fail Closed:** Ensure all checks default to denying access.
3. **No Hardcoded Roles:** Do NOT hardcode role names (e.g. `if (user.role === 'admin')`). Use dynamic Permissions resolution (`if (hasPermission('users.update'))`).

## Critical Rules
- **Privilege Boundary:** Users cannot grant roles or permissions higher than what they possess.
- **Root Protection:** Operations against the configured Root User (`isRoot === true` or managed via `RootUserService`) must strictly reject modifications from non-root actors.
- **Audit Logging:** Any change to Roles, Permissions, User Hierarchy, Passwords, or Logins must emit an Audit Event to the database.

## ABAC Context
When dealing with resources (e.g. `Post`), use ABAC contexts:
```typescript
{
  subject: User;
  action: string;
  resource: Post;
}
```
Check if the subject is the owner or within the appropriate hierarchy.
