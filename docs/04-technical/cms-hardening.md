# CMS Hardening & Tenant Isolation

This document outlines the security, tenant isolation, and validation boundaries established during Phase 2H.

## 1. Authentication & Session Management
- **Centralized API Error Handling**: The frontend API client (`apps/cms/src/api/client.ts`) globally intercepts 401 Unauthorized errors and dispatches `auth:unauthorized`. 
- **Graceful Session Clear**: The AuthContext intercepts `auth:unauthorized` to synchronously wipe local storage (`token` and `organizationId`) before performing remote logout, preventing infinite loops.

## 2. Frontend Tenant Isolation (React Query)
- **Organization Scoping**: All frontend React Query data fetching hooks (e.g., `useCategories`, `useTags`, `usePosts`) include the `activeOrganizationId` in their `queryKey` arrays (e.g., `['posts', activeOrganizationId]`).
- **Cache Invalidation**: On organization switch, the application safely drops all state or re-fetches strictly isolated data because queries are explicitly scoped. 
- **No Cache Leakage**: The strict adherence to `[entity, orgId]` query key signatures ensures no data overlaps across tenant switching operations.

## 3. Backend Tenant Verification
- **Tenant Middleware**: All CMS routes pass through `requireOrganizationContext`, which enforces standard JWT authentication AND extracts/validates the `X-Organization-Id` header against the database.
- **Service Layer Context**: All CMS operations derive organization ownership purely from the injected `req.tenant` context, rendering payload `organizationId` injection ineffective.
- **Cross-Tenant Relation Security**: The backend service layer cross-verifies that associated relations (like `tagIds` or `categoryIds`) strictly belong to the same `organizationId` before persisting new or updated entities.

## 4. API Validation Hardening
- **Strict Zod Schemas**: The CMS schema definitions enforce strict object shapes using `.strict()`, completely rejecting any unknown or unexpected properties from passing the API validation layer and polluting the database schema.

## 5. UI Resiliency
- **Permissions Guards**: Frontend actions (CREATE, UPDATE, DELETE) are wrapped entirely by the `usePermissions` hook (`can('CREATE', 'POST')`), effectively hiding unauthorized actions at the UI level.
- **Duplicate Handling**: 409 Conflict errors mapping to MongoDB `E11000` duplicate key index errors on slugs are captured on the frontend to provide human-readable form validation errors instead of generic crash screens.
