---
name: mongoose-database-setup
description: Database conventions and rules for Mongoose 8 in oneCMS.
---

# Mongoose Database Setup & Rules

## Workflow
1. **Schema Design:** Read `@docs/03-design/database-schema.md` before altering or adding schemas.
2. **Indexes:** Always explicitly declare indexes for queries you intend to run. Compound indexes are required for multi-field constraints (e.g. `{ action: 1, resource: 1 }`).
3. **Transformations:** Enforce `toJSON` transforms on all schemas to swap `_id` to `id` and remove `__v`.
4. **Secrets:** NEVER return password hashes or sensitive fields via `toJSON`. Strip them at the schema level transform.

## Critical Rules
- **Transactions:** Use MongoDB Transactions for multi-document writes (e.g., `role creation + audit event`). Mongoose 8 natively supports `.withTransaction()`. Remember that transactions require a Replica Set!
- **Lean Queries:** Use `.lean()` for performance when returning lists of items that do not require Mongoose document methods.
- **Type Safety:** Always create an Interface mapping exactly to the Schema, and export both `IModel` and `IModelDocument extends IModel, Document`.
