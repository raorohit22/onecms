# Frontend Architecture — oneCMS

## 1. Architectural Overview

The oneCMS frontend (`apps/cms`) is a Single Page Application built on **React 18 / Vite / TypeScript**, structured around feature domains, isolated state layers, and accessible design system primitives (`@onecms/ui`).

```
src/
├── api/              # Axios HTTP client, standardized queryKey factories
├── auth/             # AuthContext, OrganizationContext, RBAC permissions
├── components/       # Core app shell, layout primitives, Error Boundary
├── hooks/            # Generic useCrudResource, table state hooks (query, selection)
├── pages/            # Feature-oriented pages and editor orchestrators
│   ├── post-editor/  # Decomposed editor subcomponents & hooks
│   ├── masters/      # Master data grid and configuration
│   ├── settings/     # RBAC, ABAC, and theme management
│   └── users/        # User directory and invitation workflows
└── store/            # Zustand persistent client/UI stores
```

---

## 2. Component Design Principles

1. **Separation of Container vs Presentation**:
   - Page containers orchestrate URL state, server queries, and domain mutations.
   - Presentation components accept typed props, trigger events, and contain zero API or database awareness.

2. **Component Lifecycle & Hooks**:
   - Inputs (`props`) → State → Derived Values → Event Handlers → Render Output.
   - Strictly avoid using `useEffect` for derived values. Compute derived data directly in render or with memoized selectors.

3. **Size Limit**:
   - Maximum 200–300 lines per component file. Components exceeding this threshold are decomposed into co-located subcomponents.

---

## 3. Server State vs Client State Separation

| State Classification | Layer / Tool | Examples |
| :--- | :--- | :--- |
| **Server State** | TanStack Query v5 | Posts, Categories, Tags, Users, Revisions, AI Job Status |
| **Client UI State** | Zustand | Theme preference, Sidebar collapse/expand state |
| **URL State** | `nuqs` / React Router | Active page, limit, sort field, sort direction, active tab |
| **Form State** | React Hook Form + Zod | Post draft, Category creation form, SEO metadata |
| **Transient State** | Local `useState` | Modal dialog open state, item deletion confirmation |

---

## 4. Query Key Management

All query keys are centralized in `@cms/api/query-keys.ts`. Every cache key is scoped by `organizationId` to prevent cross-tenant data leaks during organization switching.

```ts
import { queryKeys } from '@cms/api/query-keys';

// Invalidate all post queries for current organization
queryClient.invalidateQueries({ queryKey: queryKeys.posts.all(activeOrgId) });

// Detail query
const { data } = useQuery({
  queryKey: queryKeys.posts.detail(postId, activeOrgId),
  queryFn: () => fetchPost(postId),
});
```

---

## 5. Generic CRUD Hook Factory (`useCrudResource`)

CRUD views (Categories, Tags, Posts) utilize `useCrudResource` to eliminate boilerplate:

```ts
export function useCategories(tableQuery?: TableQueryState) {
  return useCrudResource<CategoryItem, CategoryFormInput, CategoryFormInput>(
    {
      resourceKey: 'categories',
      endpoints: {
        list: '/categories',
        single: '/category',
        bulkDelete: '/categories/bulk-delete',
        export: '/categories/export',
        import: '/categories/import',
      },
    },
    tableQuery
  );
}
```
