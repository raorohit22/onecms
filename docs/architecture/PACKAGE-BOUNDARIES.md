# Package Boundaries & Export Maps — oneCMS

## 1. Package Export Contracts

All internal workspace packages declare explicit condition maps in `package.json` to guarantee seamless resolution across Node.js runtime, Next.js bundler, Vite, Vitest, and TypeScript.

### `@onecms/db` Export Map
```json
{
  "name": "@onecms/db",
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

### `@onecms/env` Export Map
```json
{
  "name": "@onecms/env",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./load": {
      "types": "./src/load.ts",
      "import": "./src/load.ts",
      "default": "./src/load.ts"
    }
  }
}
```

### `@onecms/ui` Export Map
```json
{
  "name": "@onecms/ui",
  "type": "module",
  "exports": {
    "./globals.css": "./src/styles/globals.css",
    "./postcss.config": "./postcss.config.mjs",
    "./components/*": {
      "types": "./src/components/*.tsx",
      "import": "./src/components/*.tsx",
      "default": "./src/components/*.tsx"
    },
    "./hooks/*": {
      "types": "./src/hooks/*.ts",
      "import": "./src/hooks/*.ts",
      "default": "./src/hooks/*.ts"
    },
    "./lib/*": {
      "types": "./src/lib/*.ts",
      "import": "./src/lib/*.ts",
      "default": "./src/lib/*.ts"
    }
  }
}
```

---

## 2. Boundary Enforcement Rules

1. **No Deep Private Imports**:
   - ❌ Bad: `import { Button } from '../../packages/ui/src/components/button'`
   - ✅ Good: `import { Button } from '@onecms/ui/components/button'`

2. **No App-to-App Imports**:
   - `apps/cms` NEVER imports from `apps/api` or `apps/web`.
   - All cross-application data flow occurs strictly over HTTP REST endpoints.

3. **No Upward Package Imports**:
   - `packages/db` and `packages/ui` NEVER import from `apps/*`.
