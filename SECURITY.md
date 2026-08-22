# Security Policy

## Reporting a vulnerability

Please report privately through **Security +' Report a vulnerability** on this repository, not in a public issue.

Include the revision, your configuration, the impact, and the steps to reproduce it. If it involves real data, describe the shape of it rather than pasting it.

We'll acknowledge within a few working days and tell you what we intend to do.

## What this is, and what it assumes

This application is built as a **product, not a multi-tenant SaaS**. The authorization model is highly strict but global. The limits below are real and worth reading before you deploy this to production.

**No Tenant Isolation.** oneCMS manages a single blog website. There are no organizations, tenant IDs, or workspace concepts. A user with administrative privileges operates globally across all content. Do not attempt to use this repository for multi-tenant isolation without an architectural rewrite.

**Strict Hierarchy-Based Authorization.** Authorization is enforced via dynamic Roles, Permissions, and User Hierarchies (manager/subordinate relationships). A strict Privilege Boundary exists: an actor cannot grant a permission or role that they themselves do not possess. 

**Redis is the Source of Truth for Sessions.** The API utilizes stateless short-lived JWTs combined with stateful opaque Refresh Tokens. Redis manages session revocation, token-family replay detection, and rate limiting. **If Redis goes down, the API is designed to fail-closed (returning 503)** for all authenticated routes to prevent security bypasses.

**AI Output is Untrusted.** oneCMS uses OpenAI to generate drafts and SEO metadata. All AI output is treated as untrusted external input and is validated via Zod schemas before persistence. We assume that AI content may contain hallucinations or malformed data.

## Deploying it safely

- Generate cryptographically secure `JWT_SECRET` and `REFRESH_SECRET` keys (`openssl rand -base64 32`).
- Ensure the API is served over HTTPS to enforce `HttpOnly` and `Secure` flags on the refresh token cookie.
- Keep the MongoDB and Redis instances off the public internet, accessible only within your VPC or via strict IP whitelists.
- The Root User account must be tightly controlled, as it bypasses standard permission checks. Ensure the initial Root User configuration is assigned to an administrator you trust.

## Supported versions

`main` is the only supported branch. There are no backports.

## Dependencies

If you spot a vulnerable transitive dependency, report it the same way as anything else — a PR bumping it is welcome, but tell us what the exposure is, since a CVE in a dev-only tool and one in the request path deserve different urgency.
