# Dependency Rules & Monorepo Boundaries — oneCMS

## 1. Monorepo Package Topology

```
apps/
├── api/       (Express REST API, background workers, AI orchestration)
├── cms/       (React Vite CMS admin interface)
├── web/       (Next.js public reader front-end)
└── docs/      (Documentation hub)

packages/
├── db/        (Mongoose schemas, models, domain types, DB connection)
├── ui/        (Shadcn UI primitives, Tailwind theme, common icons)
├── env/       (Root environment variable validation via Zod)
├── eslint-config/
└── typescript-config/
```

---

## 2. Dependency Direction Rules

1. **Applications depend on Packages; Packages NEVER depend on Applications.**
   - `apps/api` → `@onecms/db`, `@onecms/env`
   - `apps/cms` → `@onecms/ui`
   - `packages/db` MUST NOT import anything from `apps/api` or `apps/cms`.

2. **Applications do NOT import from each other.**
   - `apps/cms` NEVER imports directly from `apps/api` (all communication occurs over HTTP REST).
   - `apps/web` NEVER imports directly from `apps/cms`.

3. **Domain Isolation**:
   - CMS entities (Post, Category, Tag) do not directly import internal implementations of auth or billing modules.
   - Cross-domain interactions must go through exported public services or repositories.

---

## 3. Circular Dependencies

Circular imports are strictly forbidden. Use barrel files (`index.ts`) only when exporting clean public module boundaries, and avoid re-exporting internal cross-dependencies.
