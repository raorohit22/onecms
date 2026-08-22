# Database Architecture

Primary database: MongoDB.

Initial collections/entities (Multi-Tenant):
- `users`: Global identity collection.
- `organizations`: Tenant root boundaries.
- `memberships`: Maps users to organizations (contains roles).
- `workspaces`: Sub-environments under organizations.
- `roles` / `permissions`: Defined at the global or organization level.
- `posts`: Core CMS content entries. (Organization-scoped, references User for author identity)
- `categories`, `tags`: Flat taxonomy models for organizing posts. (Organization-scoped)
- `media`, `revisions`: Organization-scoped content (Deferred to future phases).
- `audit`: System-wide or organization-scoped audit logs.
- `sessions`: Redis-backed (not MongoDB).

Design rules:
- **Shared Database Isolation**: All tenants exist in the same database. Isolation is enforced at the application layer by always including `organizationId` in query filters.
- Model around access patterns.
- Index important filters/sorts, always prefixing with `organizationId` for tenant-scoped data.
- Avoid unbounded embedded arrays.
- Prefer stable references for independently managed entities.
- use timestamps
- define deletion/retention policies
- use transactions only where cross-document consistency requires them

Index design must be documented with the query it supports.

## Connection Configuration Rationale

Our MongoDB connection utilizes the following deliberate pool and timeout settings:

- `serverSelectionTimeoutMS`: `5000`
  *Rationale*: Controls how long the MongoDB driver waits to find a suitable server to execute an operation before throwing an error. The default is 30,000ms. We lower this to 5,000ms so the application fails fast rather than hanging incoming HTTP requests when the database is unreachable.
- `maxPoolSize`: `50`
  *Rationale*: Controls the maximum number of concurrent MongoDB connections the driver will open. The default is 100. We lower this to 50 for the learning project so we do not artificially exhaust connections on a smaller free-tier/learning database cluster, while still adequately demonstrating high concurrency handling.
- `minPoolSize`: `10`
  *Rationale*: Controls the minimum number of idle connections the driver maintains. This prevents latency spikes caused by connection-opening overhead when traffic suddenly arrives after an idle period.

## CMS Domain Model

The core CMS content consists of `Post`, `Category`, and `Tag`.

### Tenant Ownership
All CMS entities (`Post`, `Category`, `Tag`) are strictly scoped to the `organizationId`. 
While `workspaceId` is supported as an optional field for future sub-environments, the canonical uniqueness and security boundary remains the Organization.

### Author Architecture
**Author = User**. 
The `authorId` on `Post` references the global `User` collection. We do not maintain a separate `Author` collection in Phase 2B to avoid unnecessary duplication, since the `User` document natively provides `firstName` and `lastName`.
*Note: A Mongoose reference (`ref: 'User'`) does not enforce tenant ownership. True membership authorization must be validated at the service/repository layer during mutations.*

### Slugs and Uniqueness Constraints
CMS slugs are unique **per organization**, not globally.
- Implemented as a compound unique index: `{ organizationId: 1, slug: 1 }`.
- This ensures Organization A and Organization B can both have a post with the slug `hello-world`, but Organization A cannot have duplicate slugs internally.

### Status and Deletion
- **Status Enum:** `DRAFT`, `REVIEW`, `PUBLISHED`, `ARCHIVED`.
- **ARCHIVED ≠ DELETED:** `ARCHIVED` is a content publishing state. It is not equivalent to soft deletion. Soft-deletion features are deferred until product requirements dictate a specific trash/retention mechanism.

### Content Representation
`Post.content` is modeled as a standard `String` type. 
This representation is versatile enough to support Markdown, raw HTML, or stringified rich-text JSON (e.g. from TipTap/Lexical) depending on the frontend editor architecture. It delegates the structural validation of the content shape to the CMS service layer instead of the Mongoose schema.

### SEO
SEO metadata is embedded directly into the `Post` document (`seo` object containing `metaTitle`, `metaDescription`, `canonicalUrl`, `ogImage`, and `noIndex`).

### Media
`Post.featuredMediaId` is an optional `ObjectId`. To maintain domain focus, the actual `Media` model and upload systems are deferred to future phases.

### Important Indexes
- **`Post: { organizationId: 1, slug: 1 } (unique)`**: Enforces tenant-scoped slug uniqueness and supports high-speed public routing by slug.
- **`Post: { organizationId: 1, status: 1, publishedAt: -1 }`**: Optimizes public blog feeds fetching the latest published content for an organization.
- **`Post: { organizationId: 1, authorId: 1 }`**: Optimizes the CMS editor dashboard for authors querying their own content.
