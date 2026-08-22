# Module Architecture & Dependency Audit — oneCMS

## 1. Executive Summary

This audit investigates and diagnoses recurring module, import, and runtime resolution errors across the oneCMS monorepo.

The root cause of monorepo import failures is an **unintentional ESM/CommonJS split**:
1. `apps/api/package.json` was missing `"type": "module"`.
2. As a consequence, `tsc` (configured with `NodeNext`) treated `apps/api` as CommonJS, emitting `require()` statements in `dist/`.
3. Meanwhile, workspace packages (`@onecms/db`, `@onecms/env`, `@onecms/ui`) declared `"type": "module"`.
4. When `apps/api/dist` ran via `node dist/server.js`, Node threw `ERR_REQUIRE_ESM` because CommonJS `require()` attempted to load ES Module workspace packages.
5. In development, `tsx` masked this discrepancy by transpiling ESM imports in-memory on the fly, creating a classic **"Works in Dev, Fails in Production"** failure mode.

---

## 2. Workspace Package & Application Module Matrix

| Workspace Package | Package Location | Declared `"type"` | TypeScript Target / Module | Build System | Emitted Format | Status |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `oneCMS` (root) | `/` | *None* | Shared base | Turbo | N/A | OK |
| `@onecms/api` | `apps/api` | **MISSING** (Treated as CJS) | `NodeNext` / `NodeNext` | `tsc && tsc-alias` | CommonJS (Mismatch!) | **BROKEN** |
| `@onecms/cms` | `apps/cms` | `module` | `ESNext` / `Bundler` | `vite build` | ESM Bundle | OK |
| `@onecms/web` | `apps/web` | `module` | `ESNext` / `Bundler` | `next build` | Next.js Engine | OK |
| `@onecms/docs` | `apps/docs` | `module` | `ESNext` / `Bundler` | `next build` | Next.js Engine | OK |
| `@onecms/db` | `packages/db` | `module` | `Preserve` / `Bundler` | Source exports (`.ts`) | ESM | Needs Export Maps |
| `@onecms/env` | `packages/env` | `module` | `Preserve` / `Bundler` | Source exports (`.ts`) | ESM | Needs Export Maps |
| `@onecms/ui` | `packages/ui` | `module` | `ES2022` / `react-library` | Source exports (`.tsx`) | ESM | Needs Export Maps |
| `@onecms/typescript-config` | `packages/typescript-config` | *None* | N/A | Shared configs | JSON | OK |
| `@onecms/eslint-config` | `packages/eslint-config` | `module` | N/A | ESLint configs | ESM (`.js`) | OK |

---

## 3. Detailed Root Cause Analysis

### Issue A: Missing `"type": "module"` in `apps/api`
- **Mechanism**: Node.js and TypeScript's `NodeNext` module resolution determine whether a `.ts` file is ESM or CJS based on the nearest `package.json`'s `"type"` field.
- **Symptom**: Because `apps/api/package.json` lacked `"type": "module"`, `tsc` compiled all `import` statements into `require()` calls (`const app_1 = require("./app");`).
- **Failure**: When compiled CJS code in `apps/api/dist` attempts to `require("@onecms/db")` (which is an ESM package with `"type": "module"`), Node runtime crashes with `ERR_REQUIRE_ESM`.

### Issue B: Development vs. Production Parity Drift
- In development, `pnpm dev` executes `tsx watch --env-file=../../.env src/server.ts`. `tsx` intercepts `require` and `import` dynamically in memory, masking the fact that `dist/` compilation is broken.
- In production, `node dist/server.js` fails immediately.

### Issue C: Incomplete Package Export Conditions
- `packages/db`, `packages/env`, and `packages/ui` use simplified exports without explicit `"types"` and `"import"` conditions (e.g., `"exports": { ".": "./src/index.ts" }`).
- Modern TypeScript in `NodeNext` and `Bundler` modes requires explicit condition maps to avoid ambiguity when resolving type definitions versus runtime implementations.

### Issue D: Path Alias Resolution in Compiled ESM
- `apps/api` uses `@api/*` path aliases.
- When `apps/api` compiles to native ESM (`"type": "module"`), relative specifiers in Node ESM strictly require file extensions (`./app.js` instead of `./app`).
- `tsc-alias` must be configured with `resolveFullPaths: true` so that path aliases in `dist/` resolve to complete `.js` file paths.

---

## 4. Tooling & Configuration Module Audit

| Tool / Config File | Format | Module System | Compatibility Status |
| :--- | :--- | :---: | :--- |
| `apps/api/vitest.config.mjs` | `.mjs` | Native ESM | Compatible |
| `apps/cms/vite.config.ts` | `.ts` | Native ESM (Vite) | Compatible |
| `apps/cms/eslint.config.js` | `.js` | Native ESM (Flat Config) | Compatible |
| `apps/web/next.config.js` | `.js` | Native ESM (`export default`) | Compatible |
| `apps/docs/next.config.js` | `.js` | Native ESM (`export default`) | Compatible |
| `packages/ui/postcss.config.mjs` | `.mjs` | Native ESM | Compatible |
| `packages/ui/eslint.config.mjs` | `.mjs` | Native ESM | Compatible |
| `packages/eslint-config/*.js` | `.js` | Native ESM | Compatible |

---

## 5. Third-Party Dependencies ESM/CJS Classification

| Dependency | Upstream Format | Consumption Strategy in oneCMS |
| :--- | :--- | :--- |
| `express` | CommonJS | `import express from 'express'` with `esModuleInterop: true` |
| `mongoose` | Dual (CJS/ESM) | `import mongoose from 'mongoose'` or `import { Model } from 'mongoose'` |
| `ioredis` | Dual (CJS/ESM) | `import Redis from 'ioredis'` |
| `pino` / `pino-http` | ESM-First | `import pino from 'pino'` |
| `zod` | Dual (CJS/ESM) | `import { z } from 'zod'` |
| `argon2` | Native CJS / Dual | `import * as argon2 from 'argon2'` |
| `@aws-sdk/client-s3` | ESM | `import { S3Client } from '@aws-sdk/client-s3'` |
| `jsonwebtoken` | CommonJS | `import jwt from 'jsonwebtoken'` |
| `bullmq` | Dual (CJS/ESM) | `import { Queue, Worker } from 'bullmq'` |

---

## 6. Target Monorepo Module Topology Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    Root: ESM-First Standard                 │
└─────────────────────────────────────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  apps/web    │        │  apps/cms    │        │  apps/api    │
│  (Next.js)   │        │   (Vite)     │        │ (Express/TS) │
│type: module  │        │type: module  │        │type: module  │
│module: ESNext│        │module: ESNext│        │module:       │
│resol: Bundler│        │resol: Bundler│        │  NodeNext    │
└──────┬───────┘        └──────┬───────┘        └──────┬───────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │               Shared Packages                │
        │  @onecms/ui, @onecms/db, @onecms/env         │
        │  type: module                                │
        │  exports: { types, import, default }         │
        └──────────────────────────────────────────────┘
```
