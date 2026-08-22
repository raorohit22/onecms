# Backend Architecture — oneCMS

## 1. Architectural Layers

The oneCMS backend (`apps/api`) follows a strict layered architecture to ensure separation of concerns, testability, and deterministic tenant boundaries:

```
HTTP Request
  │
  ▼
1. Core Middleware (Request ID, Helmet, CORS, Rate Limiting, Logging)
  │
  ▼
2. Auth & Tenant Context Middleware (`requireAuth`, `requireOrganizationContext`)
  │
  ▼
3. RBAC Middleware (`requirePermission`) & Schema Validation (`validateRequest`)
  │
  ▼
4. Controllers (Input mapping, pagination bounding via `extractPagination`)
  │
  ▼
5. Services (`BaseCmsService<T>` / Domain Services)
  │
  ▼
6. Repositories (`BaseCmsRepository<T>` / `tenantRepository`)
  │
  ▼
7. Caching (`CmsCache` with non-blocking Redis SCAN) & Persistence (`Mongoose` / `MongoDB`)
```

---

## 2. Hard Multi-Tenant Isolation Boundary

Tenant isolation is strictly enforced at two levels:

1. **Context Level (`tenant.middleware.ts`)**:
   - Every protected route requires a valid `X-Organization-Id` header.
   - The user's active membership within that organization is verified in MongoDB before populating `req.tenant`.
   - Any mismatch immediately fails closed with `403 Forbidden`.

2. **Data Access Level (`BaseCmsRepository` & `tenantRepository`)**:
   - Repositories automatically append `{ organizationId: context.organizationId }` to every MongoDB query.
   - Cache keys in Redis are prefixed: `cms:{organizationId}:{entity}:{suffix}`.
   - Direct un-scoped queries (such as `Model.findById(id)`) are forbidden in CMS domain modules.

---

## 3. Data Access & Service Hierarchy

```ts
// Base Repository encapsulates tenant filter and Redis cache-aside
export class CategoryRepository extends BaseCmsRepository<ICategoryDocument, CreateCategoryInput, UpdateCategoryInput> {
  constructor() {
    super(Category, 'category');
  }
}

// Base Service encapsulates CRUD operations, conflict mapping, and pagination coordination
export class CategoryService extends BaseCmsService<ICategoryDocument, CreateCategoryInput, UpdateCategoryInput> {
  constructor() {
    super(categoryRepository, 'Category');
  }
}
```

---

## 4. Error Hierarchy & Mapping

The application uses typed error classes derived from `AppError`:

```
AppError (Base with statusCode, code, details)
├── BadRequestError (400)
├── ValidationError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── RateLimitError (429)
└── InternalServerError (500)
```

The centralized `error.middleware.ts` maps these exceptions directly into standard HTTP response envelopes without leaking server stack traces in production.
