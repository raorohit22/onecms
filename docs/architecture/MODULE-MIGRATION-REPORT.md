# Module Architecture Migration Report — oneCMS

## 1. Migration Summary

We have completed the monorepo-wide **ESM Module Architecture Standardization** for oneCMS.

---

## 2. Root Cause & Solution Matrix

| Issue | Root Cause | Architectural Fix | Regression Prevention |
| :--- | :--- | :--- | :--- |
| **`ERR_REQUIRE_ESM` in API Production** | `apps/api/package.json` was missing `"type": "module"`, causing `tsc` to compile ESM source into CommonJS `require()` calls that failed when loading ESM workspace packages (`@onecms/db`). | Added `"type": "module"` to `apps/api/package.json`. | Continuous typechecking and production build validation. |
| **Path Alias Breakage in Node ESM** | `tsc-alias` replaced `@api/*` with extensionless specifiers (`./app`), which native Node ESM rejects. | Added `"tsc-alias": { "resolveFullPaths": true }` in `apps/api/tsconfig.json`. | Production build artifact tests. |
| **Ambiguous Package Exports** | Workspace packages (`@onecms/db`, `@onecms/env`, `@onecms/ui`) used simplified string exports without `"types"` / `"import"` condition keys. | Added explicit condition maps with `"types"`, `"import"`, and `"default"`. | Explicit package contract auditing. |
| **Turborepo Cache Output Drift** | `turbo.json` build task outputs only tracked `.next/**`, ignoring `apps/api` and `apps/cms` `dist/**`. | Added `"dist/**"` to `turbo.json` build task outputs. | Monorepo cache audit. |

---

## 3. Package Status Matrix

| Package | Runtime Target | Module Standard | Resolution Strategy | Build Tool | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `@onecms/api` | Node.js 18+ | ESM (`"type": "module"`) | `NodeNext` | `tsc && tsc-alias` | **PASSED** |
| `@onecms/cms` | Browser | ESM (`"type": "module"`) | `Bundler` | `vite build` | **PASSED** |
| `@onecms/web` | Node & Browser (Next.js) | ESM (`"type": "module"`) | `Bundler` | `next build` | **PASSED** |
| `@onecms/docs` | Node & Browser (Next.js) | ESM (`"type": "module"`) | `Bundler` | `next build` | **PASSED** |
| `@onecms/db` | Shared Workspace | ESM (`"type": "module"`) | `Bundler` | Source exports (`.ts`) | **PASSED** |
| `@onecms/env` | Shared Workspace | ESM (`"type": "module"`) | `Bundler` | Source exports (`.ts`) | **PASSED** |
| `@onecms/ui` | Shared UI Library | ESM (`"type": "module"`) | `react-library` | Source exports (`.tsx`) | **PASSED** |

---

## 4. Intentional Exceptions

There are **zero CommonJS source files** remaining in application or library code.
- Tooling files requiring specific extensions use standard `.mjs` (`vitest.config.mjs`, `postcss.config.mjs`, `eslint.config.mjs`).
- ESLint configuration packages use flat native ES module format (`export const config = ...`).
