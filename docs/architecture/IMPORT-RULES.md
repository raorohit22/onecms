# Import & Module Resolution Rules — oneCMS

## 1. Monorepo Path Aliases

Always use registered monorepo aliases. Never use deep relative paths (`../../../../`):

| Scope | Path Alias | Resolves To | Defined In |
| :--- | :--- | :--- | :--- |
| **API Backend** | `@api/*` | `apps/api/src/*` | `apps/api/tsconfig.json` |
| **CMS Frontend** | `@cms/*` | `apps/cms/src/*` | `apps/cms/tsconfig.app.json` |
| **Web Frontend** | `@web/*` | `apps/web/*` | `apps/web/tsconfig.json` |
| **Docs App** | `@docs/*` | `apps/docs/*` | `apps/docs/tsconfig.json` |

---

## 2. Import Conventions Checklist

1. **Type-Only Imports**:
   ```ts
   import type { Request, Response, NextFunction } from 'express';
   import type { ITenantContext } from '@api/core/context/tenant-context';
   import type { IPostDocument } from '@onecms/db';
   ```

2. **Workspace Package Imports**:
   ```ts
   import { Post, Category, Tag } from '@onecms/db';
   import { Button } from '@onecms/ui/components/button';
   import { env } from '@api/config/env';
   ```

3. **Subpath Module Imports**:
   ```ts
   import { postController } from '../controllers/post.controller';
   import { postService } from '../services/post.service';
   import { BaseCmsRepository } from './base-cms.repository';
   ```

---

## 3. Forbidden Anti-Patterns

- ❌ `const express = require('express')` — No CommonJS `require` in source files.
- ❌ `module.exports = ...` — No CommonJS export assignment.
- ❌ `import ... from '.../packages/ui/src/...'` — Bypassing workspace package export maps.
- ❌ `import x from './file.ts'` in production Node code — Avoid raw `.ts` extensions in runtime specifiers.
