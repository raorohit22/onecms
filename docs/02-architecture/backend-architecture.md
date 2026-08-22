# Backend Architecture

Preferred request path:

Route
→ middleware
→ controller
→ application service/use case
→ repository/infrastructure
→ response mapping

Controllers:
- parse already validated input (via Zod schemas)
- call application logic
- map result to HTTP response

### API Response Structure & Behavior

The API standardizes responses to provide consistent consumption by the frontend:
- **Success Collections**: `{ data: [...], meta: { total, page, totalPages, limit } }`
- **Success Singles**: `{ data: { ... } }`
- **Errors**: Handled by global error middleware. Yields `{ error: { code, message, details? } }`.

### Pagination & Bulk Actions
- All collection endpoints (e.g., `GET /posts`, `GET /users`) accept `page`, `limit`, `sort`, and `dir` query parameters.
- Bulk actions (e.g., `POST /posts/bulk-delete`) accept `{ ids?: string[], selectAll?: boolean, excludedIds?: string[] }`. If `selectAll` is true, the service applies the action to all documents matching the current tenant, excluding `excludedIds`.

Services:
- own business behavior
- remain testable without HTTP concerns

Repositories:
- encapsulate persistence details when abstraction is useful

Infrastructure:
- database
- Redis
- object storage
- AI providers
- email/other external services if later introduced

Centralized error handling converts known application errors into stable HTTP responses.

## CMS Repository & Service Architecture

The CMS (Post, Category, Tag) leverages a strict separation of concerns to guarantee tenant isolation before any API controllers are introduced:

```
Request
    ↓
Authentication & Tenant Middleware (Validates X-Organization-Id)
    ↓
RBAC Middleware
    ↓
Controller (Phase 2D)
    ↓
CMS Service (Business Rules & Domain Validation)
    ↓
CMS Repository (Pure Data Access)
    ↓
tenantRepository (Injects { organizationId: context.organizationId })
    ↓
Mongoose Models (MongoDB)
```

### Key Security Boundaries
1. **Repository Layer:** All database lookups, updates, and deletes are inherently filtered by `tenantRepository.withTenant({}, context)`. It is structurally impossible for a repository to query a document without attaching the tenant context boundaries.
2. **Service Layer:** Business-level constraints are enforced before hitting the database:
   - `authorId` is strictly verified against the `Membership` table to ensure the user is an active participant in the current organization.
   - All `categoryIds` and `tagIds` are batch-verified to ensure they exist strictly within the current organization.
3. **Error Mapping:** The service layer captures low-level database constraints (e.g. `E11000 Duplicate Key` on slugs) and sanitizes them into controlled application errors (`AppError(409, 'CONFLICT')`).
4. **Immutability:** Operations explicitly omit `organizationId` from mutable payload types, ensuring tenant ownership cannot be transferred or overridden through standard updates.
