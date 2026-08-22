# TypeScript Configuration Architecture — oneCMS

## 1. Hierarchy & Inheritance Model

The monorepo uses a clean, single-source-of-truth TypeScript configuration hierarchy located in `@onecms/typescript-config`:

```
packages/typescript-config/
├── base.json              # Shared root strict standards (ES2022, NodeNext)
├── internal-package.json  # For source-consumed workspace packages (Preserve / Bundler)
├── nextjs.json            # Next.js applications (ESNext / Bundler / Next plugin)
└── react-library.json     # React component packages (react-jsx)
```

---

## 2. Configuration Targets by Runtime

### 2.1 Backend Runtime (`apps/api`)
- **Extends**: `@onecms/typescript-config/base.json`
- **Compiler Options**:
  ```json
  {
    "extends": "@onecms/typescript-config/base.json",
    "compilerOptions": {
      "rootDir": "src",
      "outDir": "dist",
      "noEmit": false,
      "paths": {
        "@api/*": ["./src/*"]
      }
    },
    "tsc-alias": {
      "resolveFullPaths": true
    },
    "include": ["src"]
  }
  ```
- **Rationale**: `NodeNext` matches the native Node.js 18+ module loader. `tsc-alias` with `resolveFullPaths` ensures path aliases in `dist/` resolve to complete `.js` file specifiers.

### 2.2 Next.js Applications (`apps/web`, `apps/docs`)
- **Extends**: `@onecms/typescript-config/nextjs.json`
- **Compiler Options**:
  - `module: "ESNext"`
  - `moduleResolution: "Bundler"`
  - `jsx: "preserve"`
  - `noEmit: true`

### 2.3 Browser Single-Page Applications (`apps/cms`)
- **Vite-managed**:
  - `module: "ESNext"`
  - `moduleResolution: "Bundler"`
  - `jsx: "react-jsx"`
  - `noEmit: true`

### 2.4 Internal Workspace Packages (`packages/db`, `packages/env`, `packages/ui`)
- **Extends**: `@onecms/typescript-config/internal-package.json` or `react-library.json`
- **Compiler Options**:
  - `module: "Preserve"`
  - `moduleResolution: "Bundler"`
  - `noEmit: true`
- **Rationale**: Packages export TypeScript source files directly to avoid dual compilation steps in local monorepo development.
