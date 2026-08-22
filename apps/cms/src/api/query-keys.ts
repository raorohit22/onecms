import type { TableQueryState } from '../hooks/use-table-query';

/**
 * Standardized Query Key Factory.
 * 
 * Provides centralized, predictable, and tenant-scoped query keys for TanStack Query.
 * Guarantees that:
 * 1. Cache keys are strictly isolated by `organizationId` to prevent cross-tenant cache bleeding.
 * 2. Invalidation targets are hierarchical (e.g. invalidating `postKeys.all(orgId)` clears lists & details).
 * 3. Parameter changes (sorting, pagination) produce deterministic cache keys.
 */
export const queryKeys = {
  posts: {
    all: (orgId?: string) => ['posts', orgId] as const,
    lists: (orgId?: string) => ['posts', orgId, 'list'] as const,
    list: (orgId?: string, query?: TableQueryState) => [
      'posts',
      orgId,
      query?.page,
      query?.pageSize,
      query?.sort,
      query?.dir
    ] as const,
    details: (orgId?: string) => ['post', orgId] as const,
    detail: (id?: string, orgId?: string) => ['post', id, orgId] as const,
    revisions: (id?: string) => ['post-revisions', id] as const,
  },

  categories: {
    all: (orgId?: string) => ['categories', orgId] as const,
    list: (orgId?: string, query?: TableQueryState) => [
      'categories',
      orgId,
      query?.page,
      query?.pageSize,
      query?.sort,
      query?.dir
    ] as const,
    detail: (id?: string, orgId?: string) => ['category', id, orgId] as const,
  },

  tags: {
    all: (orgId?: string) => ['tags', orgId] as const,
    list: (orgId?: string, query?: TableQueryState) => [
      'tags',
      orgId,
      query?.page,
      query?.pageSize,
      query?.sort,
      query?.dir
    ] as const,
    detail: (id?: string, orgId?: string) => ['tag', id, orgId] as const,
  },

  users: {
    all: (orgId?: string) => ['users', orgId] as const,
    list: (orgId?: string, query?: TableQueryState) => [
      'users',
      orgId,
      query?.page,
      query?.pageSize,
      query?.sort,
      query?.dir
    ] as const,
    detail: (id?: string, orgId?: string) => ['user', id, orgId] as const,
  },

  roles: {
    all: (orgId?: string) => ['roles', orgId] as const,
  },

  masters: {
    all: (orgId?: string) => ['masters', orgId] as const,
    type: (slug: string, orgId?: string) => ['masters', slug, orgId] as const,
  },

  dashboard: {
    all: (orgId?: string) => ['dashboard', orgId] as const,
    stats: (orgId?: string) => ['dashboard', 'stats', orgId] as const,
  }
};
