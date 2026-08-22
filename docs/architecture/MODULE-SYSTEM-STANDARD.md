# Module System Standard — oneCMS

## 1. Primary Architecture Directive: ESM-First

oneCMS adheres strictly to an **ESM-First (ECMAScript Modules)** architecture across all applications and shared packages.

### Rules:
1. **Source Code**: All application and library source code MUST use standard ES module `import` and `export` statements. CommonJS primitives (`require`, `module.exports`, `exports.`) are forbidden in source files.
2. **`package.json` Standard**: Every TypeScript/JavaScript package in the monorepo MUST declare:
   ```json
   "type": "module"
   ```
3. **Module Resolution Strategy**:
   - **Node.js Backend (`apps/api`)**: Uses `module: "NodeNext"` and `moduleResolution: "NodeNext"`.
   - **Browser / Next.js / Vite Apps (`apps/cms`, `apps/web`, `apps/docs`)**: Uses `module: "ESNext"` and `moduleResolution: "Bundler"`.
   - **Internal Shared Packages (`packages/db`, `packages/env`, `packages/ui`)**: Uses `module: "Preserve"` or `react-library` with `"moduleResolution": "Bundler"`.

---

## 2. Package.json Standards

Each workspace package must have clean, intentional metadata:

```json
{
  "name": "@onecms/pkg-name",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    }
  }
}
```

---

## 3. Extension & Import Conventions

| File Type | Extension | When to Use |
| :--- | :--- | :--- |
| **TypeScript Source** | `.ts` | Standard backend, utility, hook, and service code. |
| **React Components** | `.tsx` | React / Next.js JSX components. |
| **Native ESM Config** | `.mjs` | Tooling configs (Vitest, PostCSS, ESLint) requiring explicit ESM execution. |
| **CommonJS Config** | `.cjs` | Only when third-party tools explicitly lack ESM support. |
| **Package-Default JS** | `.js` | Standard JavaScript executed according to package `"type": "module"`. |

---

## 4. Export & Import Standards

### Preferred: Explicit Named Exports
```ts
// Service / Utility / Constant
export const postService = new PostService();
export function extractPagination() {}
```

### Type-Only Imports
Always use `import type` for type definitions to prevent runtime overhead and phantom dependencies:
```ts
import type { ITenantContext } from '@api/core/context/tenant-context';
import type { IPostDocument } from '@onecms/db';
```

### Third-Party CommonJS Interoperability
When importing legacy CommonJS dependencies, use default imports under `esModuleInterop: true`:
```ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import * as argon2 from 'argon2';
```
