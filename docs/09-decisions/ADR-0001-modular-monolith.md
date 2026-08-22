# ADR-0001 — Use a Modular Monolith

**Status:** Accepted

## Context

oneCMS is a focused CMS and learning project. Microservices would add operational and
distributed-system complexity without a current product requirement.

## Decision

Use a modular monolith for the backend.

## Alternatives

### Microservices
Rejected for initial scope due to unnecessary distributed complexity.

### Serverless-per-feature
Rejected because it obscures the learning objective around a coherent Express application.

## Consequences

Positive:
- simpler local development
- simpler deployment
- easier transactions
- clear module boundaries
- lower operational overhead

Negative:
- requires discipline to prevent module coupling
- future extraction may require explicit boundaries

Extraction is allowed only when justified by measurable architectural requirements.
