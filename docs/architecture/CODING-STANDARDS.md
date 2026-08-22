# Coding Standards & Guidelines — oneCMS

## 1. Core Engineering Principles

1. **SOLID Design**:
   - Single responsibility for functions, classes, components, and hooks.
   - Open for extension via configuration and generic base classes.
   - Interface segregation: focused interfaces instead of bloated god interfaces.

2. **DRY (Don't Repeat Yourself)**:
   - Extract recurring domain logic into shared base classes (`BaseCmsService`, `BaseCmsRepository`) or hook factories (`useCrudResource`).
   - Extract common request parsing into utilities (`extractPagination`).

3. **KISS & YAGNI**:
   - Prefer simple, readable, and deterministic solutions over speculative abstractions.
   - No unnecessary microservices, CQRS, or multi-layered DI frameworks.

---

## 2. TypeScript & Type Safety

- **No `any`**: Use explicit interfaces, generics, or `unknown` with runtime type narrowing.
- **Runtime Validation**: Use **Zod** schemas for all external inputs (API request body, query params, path params, env variables).
- **Import Aliases**: Always use monorepo path aliases:
  - API: `@api/*`
  - CMS: `@cms/*` (or relative within app)
  - Packages: `@onecms/db`, `@onecms/ui`, `@onecms/env`

---

## 3. Function & File Size Limits

- **Functions**: Maximum 40 lines (prefer 10–25 lines). Use early returns (guard clauses) to keep nesting under 3 levels.
- **Files**: Maximum 250–300 lines. Break large files into co-located subcomponents and domain utilities.

---

## 4. Code Comments & Documentation

- Every non-trivial function, algorithm, and architectural boundary must include educational comments explaining **why** the decision was made, not just restating the mechanics.
- Document security boundaries, tenant isolation assumptions, and performance trade-offs.
