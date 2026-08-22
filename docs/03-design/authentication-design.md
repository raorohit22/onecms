# Authentication Design

Authentication must provide:
- secure credential handling
- session/token lifecycle
- logout
- expiry
- revocation strategy
- brute-force/rate-limit controls

Exact token/session mechanism is an ADR-level decision before production implementation.

Never store plaintext passwords.

Prefer HTTP-only secure cookies for browser-sensitive tokens where appropriate.
