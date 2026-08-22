# Non-Functional Requirements

## Performance

NFR-PERF-001 — Standard API reads should target p95 latency under 300ms in a defined production baseline.

NFR-PERF-002 — Public pages should use appropriate server rendering/caching/revalidation strategies.

NFR-PERF-003 — Database queries for high-volume paths must use appropriate indexes.

## Availability

NFR-AVAIL-001 — Production should target 99.9% monthly availability for core services once production infrastructure is established.

## Scalability

NFR-SCALE-001 — API instances should be horizontally scalable without requiring process-local session state.

NFR-SCALE-002 — Long-running work should be moved to background workers.

## Security

NFR-SEC-001 — All protected endpoints require authentication.

NFR-SEC-002 — Authorization is server-side.

NFR-SEC-003 — Secrets are not committed to source control.

NFR-SEC-004 — Sensitive credentials are not written to logs.

NFR-SEC-005 — External input is validated.

NFR-SEC-006 — File uploads are restricted by type and size.

## Reliability

NFR-REL-001 — Critical asynchronous jobs support retry and failure handling.

NFR-REL-002 — Important write operations are designed for idempotency where retries are possible.

## Maintainability

NFR-MAINT-001 — Modules have clear responsibilities.

NFR-MAINT-002 — Business logic is independently testable.

NFR-MAINT-003 — Significant architecture decisions are recorded as ADRs.

NFR-MAINT-004 — Public APIs are versioned where appropriate.

## Observability

NFR-OBS-001 — Backend logs are structured.

NFR-OBS-002 — Errors can be correlated to requests.

NFR-OBS-003 — Production failures are observable through an error tracking system.

## Accessibility

NFR-A11Y-001 — CMS and public website target WCAG 2.2 AA practices for relevant UI.

## Compatibility

NFR-COMP-001 — Supported browser/device matrix is documented before production release.

## Testing

NFR-TEST-001 — Critical business logic has automated unit tests.

NFR-TEST-002 — Critical API workflows have integration/API tests.

NFR-TEST-003 — Critical user journeys have E2E tests.

NFR-TEST-004 — CI must execute required automated checks before merge.
