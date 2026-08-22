# CI/CD Strategy

Pull request checks:
- dependency installation
- lint
- typecheck
- unit tests
- integration/API tests
- build
- relevant E2E tests

Protected branches should require successful checks.

Deployment should be automated after required approvals/checks.
