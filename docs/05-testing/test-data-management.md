# Test Data Management

Test data must be:
- deterministic
- isolated
- easy to create
- easy to clean

Prefer factories/builders for repeatable test data.

Never run tests against production databases.

E2E environments must have dedicated credentials and datasets.
