# Strict Rules - Always Review Before Starting Any Work

You must always check and see if there are any relevant skill files you should review before starting a task. 
For example, if you're working on the frontend, always review the `react-shadcn-ui` and `vercel-react-best-practices` skills. If you're working on the backend, review the `express-typescript-best-practices` and `mongoose-database-setup` skills.

Please check `.agents/skills/` below. If you're working on anything related, review the rules and let the user know you've read them.

## 1. Code Comments (Educational/Contextual)
Unlike some other repositories, **you must add code comments** to the code you write. 
Because oneCMS is a production-grade MERN learning project, provide robust educational and contextual comments explaining the "why" and "how" of complex logic, algorithms, and architectural boundaries.

## 2. Requirements & Product Overview
Read `@docs/01-requirements/product-requirements.md` and `@docs/02-architecture/system-overview.md` before making architectural decisions.
oneCMS is a focused, AI-assisted CMS, NOT a general-purpose SaaS or multi-tenant app. Do not introduce workspace/tenant concepts.

## 3. Development Workflow
Read `@docs/development-workflow.md`. 
Agents are allowed to accelerate implementation, but the engineering process remains human-controlled. You must use repository source-of-truth documents and must not invent requirements.

## 4. Environment / Configuration
Read `@docs/04-technical/environment-configuration.md`.
There is **one `.env`** at the root of the repository, managed by `@onecms/env`. Do not scatter environment variables. If you add a variable, add it to the root `.env.example`.

## 5. Security & Authorization
Authorization is STRICTLY ENFORCED server-side.
Read `@docs/06-security/security-architecture.md`. 
Never expose secrets, never log passwords or API keys. Always fail-closed. 

## 6. Monorepo Aliases
Always use proper imports. Do not use relative paths `../../../` when aliases exist.
- API: `@api/*` → `apps/api/src/*`
- CMS: `@cms/*` → `apps/cms/src/*`
- Web: `@web/*` → `apps/web/src/*`
- Docs: `@docs/*` → `apps/docs/*`

## 7. Quality Gates (Definition of Done)
Before claiming a feature is done, you must verify:
- Unit / Integration / E2E Tests pass (via `pnpm test`).
- Typecheck passes (via `pnpm typecheck`).
- Build passes (via `pnpm build`).
