# Database Schema Design

This document is a design baseline, not a final Mongoose schema.

## Post

Fields:
- _id
- title
- slug
- excerpt
- content
- status
- authorId
- categoryIds
- tagIds
- featuredMediaId
- seo
- publishedAt
- createdAt
- updatedAt
- deletedAt where soft delete is adopted

## User

Fields:
- _id
- email
- passwordHash or external identity reference
- name
- roles
- status
- createdAt
- updatedAt

## Media

Fields:
- _id
- storageKey
- publicUrl/derived URL
- filename
- mimeType
- size
- width
- height
- alt
- uploadedBy
- createdAt

## Revision

Fields:
- _id
- postId
- version
- content snapshot/patch according to final strategy
- createdBy
- createdAt

## AI Generation

Fields:
- _id
- userId
- operation
- provider
- model
- promptVersion
- input metadata
- output metadata
- token/cost metadata where available
- status
- createdAt

Final indexes must be based on documented query patterns.

## Schema Conventions

All future Mongoose schemas must adhere to the following conventions:

- **Timestamps**: Enabled by default (`timestamps: true`) to automatically manage `createdAt` and `updatedAt`.
- **ObjectId**: Used internally (`_id`), but transformed to a string `id` in JSON responses.
- **JSON Transformation**: Implement `toJSON` transformations to normalize `_id` to `id` and remove internal fields (like `__v`) from API responses:
  ```json
  {
    "id": "66b8...",
    "title": "..."
  }
  ```
  *Rationale*: `__v` is an internal persistence concern (Mongoose version key) and should never leak into API contracts. Exposing Mongo-specific internals couples the API to the database.
- **Strictness**: `strict: true` (default) to prevent unmapped fields from being saved.
- **Collection Naming**: Always explicitly specify the collection name in the schema options rather than relying on Mongoose pluralization.
