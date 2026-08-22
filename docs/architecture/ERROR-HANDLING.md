# Error Handling Architecture — oneCMS

## 1. Backend Error Handling Strategy

1. **Centralized Error Hierarchy**:
   All operational backend errors inherit from `AppError` (`@api/core/errors/AppError`).
   - `NotFoundError` (404)
   - `ConflictError` (409)
   - `ValidationError` (400)
   - `UnauthorizedError` (401)
   - `ForbiddenError` (403)
   - `RateLimitError` (429)

2. **Error Middleware Boundary (`error.middleware.ts`)**:
   - Catches all uncaught exceptions and synchronous/async errors via Express error pipeline.
   - Formats responses into standardized envelopes: `{ error: { code: string, message: string, details?: unknown } }`.
   - In `development` mode, returns `stack` trace. In `production`, omits stack traces to prevent sensitive system leakage.
   - Logs errors via Pino (`logger.error({ err }, ...)`).

---

## 2. Frontend Error Handling Strategy

1. **Global Error Boundary (`GlobalErrorBoundary`)**:
   - Catches uncaught React render exceptions.
   - Displays a clean error screen with reload/navigation actions.

2. **Mutation & Query Errors**:
   - Catches TanStack Query mutation errors in `onError` handlers or within `try/catch` of async triggers.
   - Surfaces user-friendly notification toasts (`toast.error(...)`) with actionable error messages.
   - Maps 409 Conflict errors to specific form fields (e.g. `form.setError('slug', { message: '...' })`).

3. **Intentional Error Swallows**:
   - Any fire-and-forget background operation where errors are safely ignored (e.g., client-side logout cleanup) must be explicitly documented with code comments explaining why.
