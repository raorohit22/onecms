---
name: express-typescript-best-practices
description: Best practices for building the oneCMS Express backend.
---

# Express & TypeScript Best Practices

## Workflow
1. **Understand Context:** Always verify existing Express middleware stack (`apps/api/src/app.ts` or `server.ts`) before adding new routes.
2. **Controller Layer:** Keep controllers thin. The controller's only responsibility is to parse `req`, pass parameters to the service, and format `res`. 
3. **Service Layer:** All business logic lives in `*.service.ts` files.
4. **Validation:** Use `Zod` for all request validation (Body, Query, Params) BEFORE it hits the controller. Do not manually validate in the controller.
5. **Types:** Define strict TypeScript interfaces for all inputs/outputs. Never use `any`. Use `unknown` if truly dynamic, or properly narrowed types.

## Critical Rules
- **Error Handling:** Use `try/catch` and forward errors to `next(err)`. Do not use `console.log`; use `logger.error` via Pino.
- **Async:** Always await asynchronous calls. Do not return unhandled promises directly in Express unless wrapped.
- **Fail Closed:** Ensure controllers that require auth use the `requireAuth` middleware explicitly.
