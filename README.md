# oneCMS

oneCMS is a focused, AI-assisted Content Management System for managing a blog website. It provides an administrative interface for creating, editing, organizing, and publishing content, alongside a separate public Next.js website. 

Built as a production-grade MERN stack learning project, it intentionally bounds its scope to a CMS (not a general SaaS or multi-tenant app).

| Layer | Technology |
| --- | --- |
| **API** | [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) with TypeScript |
| **Data** | [MongoDB](https://www.mongodb.com/) & [Mongoose 8](https://mongoosejs.com/) + [Redis](https://redis.io/) |
| **Auth** | Custom JWT (Access) & Opaque HttpOnly (Refresh) + Global Session Revocation |
| **CMS** | [React](https://react.dev/) + [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/) + [TipTap](https://tiptap.dev/) |
| **Web** | [Next.js](https://nextjs.org/) App Router + [Tailwind CSS](https://tailwindcss.com/) |
| **Tooling** | [pnpm](https://pnpm.io/) + [Turborepo](https://turborepo.dev/) + [Vitest](https://vitest.dev/) |

### Layout

| Path | Purpose |
| --- | --- |
| `apps/api` | Node.js + Express backend (HTTP, Auth, Business Logic) |
| `apps/cms` | React SPA for administrative users and editors |
| `apps/web` | Next.js public-facing blog website |
| `apps/docs` | Next.js documentation portal |
| `docs/` | Repository source-of-truth documentation |
| `packages/ui` | Shared React components and Tailwind configuration |
| `packages/eslint-config` | Shared ESLint configurations |
| `packages/typescript-config` | Shared tsconfig bases |

### Three rules the codebase holds to

- **Architecture First:** The API is a modular monolith. Controllers remain extremely thin, passing validated payloads down to dedicated Application Services where the core business logic resides.
- **Fail-Closed Security:** Authorization is strictly enforced server-side. Security decisions default to denying access. 
- **AI is Assistive:** While oneCMS heavily integrates OpenAI for drafting, outlining, and SEO optimization, AI generated content must *never* be automatically published without human editorial review.

## Quick start

You need [Node.js 18+](https://nodejs.org/) and [pnpm](https://pnpm.io/).

```sh
git clone https://github.com/your-org/oneCMS.git && cd oneCMS
cp .env.example .env  # Fill in the required secrets
pnpm install

# Start development servers
pnpm run dev
```

The CMS runs on `localhost:5173` (Vite), the API on `localhost:3001`, and the public Web on `localhost:3000`.

## Configuration

**There is one primary `.env` file located at the repository root.** It is loaded automatically across all apps by `@onecms/env`. Do not scatter environment variables across workspaces unless strictly necessary.

| Variable | Purpose |
| --- | --- |
| `PORT` | API Port (defaults to 3001) |
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URI` | Redis connection string for session state and rate limiting |
| `JWT_SECRET` | Secret used to sign RS256 access tokens |
| `OPENAI_API_KEY` | Used by the AI assistance module |

## Tasks

| Command | Purpose |
| --- | --- |
| `pnpm run dev` | Run all applications in development mode |
| `pnpm run build` | Build all apps and packages |
| `pnpm run test` | Run the Vitest/Supertest test suite |
| `pnpm run typecheck` | Run `tsc --noEmit` across all workspaces |
| `pnpm run lint` | Run ESLint across the repository |

Scope any command to a specific workspace using Turborepo filters: `pnpm run test --filter @onecms/api`

## Contributing

Please refer to `docs/development-workflow.md` and `docs/definition-of-done.md` before starting work. All changes should include appropriate Vitest tests. 

Security issues go through [SECURITY.md](./SECURITY.md), privately, not a public issue.
