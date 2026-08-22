# Testing Strategy

oneCMS uses a layered testing strategy.

## Unit
Tool: Vitest

Purpose:
- business rules
- services
- utilities
- validators
- permission logic
- AI parsing/normalization

## Integration
Tool: Vitest

Purpose:
- repository/database behavior
- module interactions
- persistence rules
- infrastructure adapters

## API
Tools: Vitest + Supertest

Purpose:
- HTTP contracts
- authentication/authorization
- validation
- status codes
- response shapes
- end-to-end API behavior

## Component
Tools: Vitest + React Testing Library

Purpose:
- user-visible React behavior
- forms
- tables
- editor integrations
- permission-aware UI
- loading/error/empty states

## E2E
Tool: Playwright

Purpose:
- critical business workflows across browser + API + persistence.

## Test Pyramid

Many focused unit tests
→ fewer integration/API tests
→ focused component tests
→ small but comprehensive set of critical E2E tests

## Test Principles

- Test behavior, not implementation details.
- Prefer deterministic tests.
- Isolate external dependencies.
- Avoid arbitrary sleeps.
- Clean test data reliably.
- Keep E2E suites focused on business-critical paths.
