# Testing Baseline Report

## Current Test Framework
- **Backend (`apps/api`)**: `vitest` is installed and used for integration testing. `supertest` is used for API endpoint assertions. `mongodb-memory-server` and `@testcontainers/redis` are used for isolated data-store testing.
- **Frontend (`apps/cms`)**: No testing framework is currently installed or configured.
- **Shared Packages (`packages/db`, `packages/env`, `packages/ui`)**: No independent unit tests currently exist for these packages.

## Existing Test Suites
The only existing test suites are located in `apps/api/tests/integration`:
- `database.test.ts`
- `health.test.ts`
- `rbac.test.ts`
- `redis.test.ts`
- `tenant-isolation.test.ts`
- `cms/category.routes.test.ts`
- `cms/category.service.test.ts`
- `cms/post.routes.test.ts`
- `cms/post.service.test.ts`
- `cms/tag.routes.test.ts`
- `cms/tag.service.test.ts`

These represent some foundational backend integration and route testing, specifically targeting the CMS domain and some basic tenant isolation constraints.

## Missing Testing Infrastructure
- **Frontend Unit/Component Testing**: Missing `vitest` (or Jest) + `react-testing-library` in `apps/cms`.
- **E2E Testing**: Missing `playwright` or `cypress` across the monorepo for full application workflows.
- **UI Store / State Testing**: Missing tests for `zustand` stores.
- **Data Fetching Tests**: Missing tests for `react-query` cache and invalidation logic.
- **Package Testing**: Missing isolated unit testing in `packages/db` (for Mongoose hooks/schemas) and `packages/ui`.
- **Mocks & Fixtures**: Missing centralized factories/fixtures for Tenants, Users, Posts, Categories, Tags.
- **Performance/Load Testing**: Missing `k6` or `artillery` for endpoint stress testing.

## Coverage Estimates
- **Unit Coverage**: Very Low (~0%). Pure functions, validators, and formatters are currently untested.
- **Component Coverage**: 0%. React components are completely untested.
- **Integration Coverage (Backend)**: Medium (~40%). CMS routes and some RBAC/tenant isolation boundaries have integration tests.
- **API Coverage**: Medium (~40%).
- **E2E Coverage**: 0%.
- **Critical-Path Coverage**: Low. The UI login -> post creation workflow is untested.

## High-Risk / Critical Modules Requiring Immediate Testing
1. **Tenant Middleware (`tenant-context.ts`, `tenant.repository.ts`)**: The core security boundary.
2. **Authorization Middleware (`require-permissions`, `check-role`)**: Prevents privilege escalation.
3. **Mongoose Hooks (`packages/db`)**: Crucial business logic (audit logging, schema validation) embedded in data models.
4. **Zustand State (`ui-store.ts`)**: Ensures no tenant leakage on the client.
5. **React Query Configuration**: Ensures proper tenant-scoped cache keys on the frontend.
6. **BullMQ Background Workers (`ai.queue.ts`)**: Need to ensure asynchronous tasks don't fail silently or leak data.

## Next Steps
This baseline dictates that we must heavily invest in Frontend Testing Infrastructure, Unit Testing for shared logic, and comprehensive E2E testing to cover the entire tenant workflow.
