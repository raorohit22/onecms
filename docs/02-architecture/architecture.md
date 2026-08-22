# Architecture Principles

## Modular Monolith

The system is deployed as a small number of independently runnable applications,
but the backend remains a modular monolith.

## Dependency Direction

HTTP adapters depend on application logic.
Application logic depends on domain abstractions.
Infrastructure implements required adapters.

Avoid domain/business logic in route definitions and controllers.

## Principles

- Explicit module boundaries
- Dependency inversion where useful
- Thin controllers
- Testable services
- Stable API contracts
- Observability by default
- Secure-by-default
- Incremental complexity
