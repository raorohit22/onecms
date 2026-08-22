# Refactoring Roadmap & Migration History — oneCMS

## 1. Completed Refactoring (Phases 1–3)

### Phase 1: P0 Security & Leakage Fixes
- `[x]` Enabled active RBAC validation in `apps/cms/src/auth/permissions.ts` (removed `return true` scaffolding bypass).
- `[x]` Replaced all raw `console.error` instances across API backend with structured Pino `logger`.
- `[x]` Replaced frontend `console.error` calls with descriptive user-facing toasts.
- `[x]` Documented intentional fire-and-forget logout error handling in `auth-context.tsx`.

### Phase 2: P1 DRY Elimination & Component Decomposition
- `[x]` Implemented generic `useCrudResource` hook factory in `apps/cms/src/hooks/use-crud-resource.ts`.
- `[x]` Refactored `use-categories.ts`, `use-tags.ts`, and `use-posts.ts` to consume `useCrudResource`.
- `[x]` Implemented `BaseCmsRepository<TDoc, TCreate, TUpdate>` with automatic Redis cache-aside and tenant scoping.
- `[x]` Implemented `BaseCmsService<TDoc, TCreate, TUpdate>` with CRUD domain coordination and duplicate key conflict mapping.
- `[x]` Created typed `AppError` hierarchy (`NotFoundError`, `ConflictError`, `ValidationError`, etc.).
- `[x]` Standardized TanStack Query key factory in `@cms/api/query-keys.ts`.
- `[x]` Deconstructed `PostEditor.tsx` (413 lines) into single-responsibility subcomponents (`PostPublishingSidebar`, `PostSeoSidebar`, `PostRevisionHistory`, `use-post-autosave`, `use-ai-assist`).
- `[x]` Created `extractPagination` controller utility with a hard max limit of 100 to prevent DoS.

### Phase 3: P2 Performance & Architecture Evolution
- `[x]` Converted hardcoded CORS origins in `app.ts` to environment-driven configuration via `env.CORS_ORIGINS`.
- `[x]` Replaced blocking Redis `KEYS` with non-blocking cursor-based `SCAN` batches in `cms-cache.ts`.
- `[x]` Added 60s Redis caching for recursive RBAC permission resolution in `rbac.service.ts`.

---

## 2. Planned Future Enhancements (Phase 4 / Post-Audit)

- `[ ]` **Virtualization for Large Tables**: Integrate `@tanstack/react-virtual` for data tables exceeding 500 rows per page if infinite scrolling is adopted.
- `[ ]` **CI/CD Pipeline Integration**: Add GitHub Actions workflow for parallel `pnpm typecheck`, `pnpm lint`, and unit test runners.
- `[ ]` **Granular Field-Level ABAC**: Expand attribute-based access control rules for dynamic custom post fields.
