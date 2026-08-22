# Regression Test Suite

The Regression Test Suite is run comprehensively before any major release to ensure that existing functionality (especially around multi-tenancy and security boundaries) remains intact.

## 1. Security & Isolation Boundaries (Critical)
- `[ ]` **Tenant Isolation**: Tenant A cannot read, update, or delete Tenant B's Posts, Categories, or Tags.
- `[ ]` **Cache Bleed**: Rapid concurrent requests across different tenants do not result in crossed cache data.
- `[ ]` **RBAC Verification**: Users with a 'Viewer' role cannot perform `CREATE`, `UPDATE`, or `DELETE` actions.
- `[ ]` **Token Replay/Expiry**: Expired session tokens are immediately rejected.
- `[ ]` **XSS Prevention**: Malicious `<script>` tags injected into TipTap editor are sanitized before storage and rendering.

## 2. API Integrity
- `[ ]` **Rate Limiting**: Hitting the authentication endpoint 50+ times per minute triggers a 429 Too Many Requests.
- `[ ]` **Pagination**: Requesting `limit=1000` is capped by the server to maximum bounds (e.g., 100) to prevent denial of service.
- `[ ]` **Operator Injection**: Passing `$ne` or `$gt` objects via query parameters fails validation.
- `[ ]` **Error Formatting**: Internal 500 errors do not leak stack traces or Mongoose schema details.

## 3. Frontend State & Interactions
- `[ ]` **Optimistic UI**: Deleting a post removes it from the UI immediately, and rolls back if the network request fails.
- `[ ]` **Form Validation**: Submitting a post without a title highlights the title field with a validation error.
- `[ ]` **Zustand Persistence**: Reloading the page retains the active theme (Dark/Light) and sidebar state.
- `[ ]` **Debounced Autosave**: Typing rapidly in the editor only triggers a save 500ms after typing stops.

## 4. Workflows
- `[ ]` **Content Pipeline**: User can successfully use the AI-generate tool (via BullMQ), poll for the result, and insert it into the editor.
- `[ ]` **Bulk Actions**: Selecting multiple posts and applying "Bulk Delete" successfully removes all selected items and refreshes the table.
- `[ ]` **Export/Import**: Exporting a CSV of categories and re-importing it does not crash or duplicate existing slugs.
