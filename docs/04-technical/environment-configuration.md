# Environment Configuration

We use `zod` to validate all environment variables on startup.
- Safe defaults are provided for local development where possible.
- The process will fail fast and exit if required variables are missing or invalid.
- Validation errors do not log secrets.

Configuration is centralized in `apps/api/src/config/env.ts`. Code should import `env` from this module rather than accessing `process.env` directly.
