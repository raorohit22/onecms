---
name: testing-vitest-supertest
description: Conventions for E2E and Unit testing using Vitest, Supertest, and memory servers in oneCMS.
---

# Testing Guidelines (Vitest & Supertest)

## Workflow
1. **Unit Tests (`tests/unit/`)**:
   - Mock external dependencies (e.g., Redis, external API).
   - Mock Mongoose models for rapid testing.
2. **Integration Tests (`tests/integration/`)**:
   - Do NOT mock the database.
   - Use `mongodb-memory-server` to orchestrate an ephemeral Mongo daemon.
   - Use `testcontainers` for Redis.
3. **E2E Tests (`tests/e2e/`)**:
   - Use Supertest to drive full HTTP lifecycles against the Express app.

## Critical Rules
- **Isolation:** Each test must run independently. Use `beforeEach` to `flushall()` Redis and clear collections via `Model.deleteMany({})`.
- **Environment:** Never load production `.env` files during tests. Use explicit mock variables configured in `vitest.setup.ts`.
- **No Flakes:** Do not use `setTimeout` for async logic. Await the actual Promises or events.
