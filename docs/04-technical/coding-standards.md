# Coding Standards

- TypeScript strict mode.
- Explicit domain types.
- Avoid `any` except documented unavoidable boundaries.
- Prefer small cohesive modules.
- No business logic in route definitions.
- Validate external input.
- Handle errors explicitly.
- Use meaningful names.
- Avoid premature abstractions.
- Prefer composition.
- Keep functions focused.
- Do not commit secrets.
- Keep formatting/linting automated.

Code should be understandable by another engineer without relying on the original author.

## Import Aliases

The project standardizes absolute imports to prevent deep relative paths (e.g. `../../../`).

Aliases map cleanly to application directories:
- `@api/*` → `apps/api/src/*`
- `@cms/*` → `apps/cms/src/*`
- `@web/*` → `apps/web/*`
- `@docs/*` → `apps/docs/*`

**Rules:**
- Use aliases for non-local imports. Avoid excessive aliasing for sibling files within the same cohesive tiny module.
- Never cross application boundaries (e.g., do not import `@cms` inside `@api`).
- Shared code should reside in workspace packages (e.g., `@onecms/ui`, `@onecms/types`).

## Linting

The repository relies on `@onecms/eslint-config` as the single source of truth for linting. All applications must implement standard scripts and consume the shared config to ensure uniformity. Do not disable rules merely to pass CI checks; fix the underlying structural issue.
