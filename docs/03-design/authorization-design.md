# Authorization Design

Use RBAC/permission checks.

Conceptual permissions:
- posts:read
- posts:create
- posts:update
- posts:delete
- posts:publish
- media:manage
- users:manage
- settings:manage
- audit:read
- ai:use

Server-side authorization is authoritative.

The CMS may hide inaccessible actions for UX, but API authorization must always remain active.
