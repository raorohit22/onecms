# Acceptance Criteria Conventions

Each feature should define acceptance criteria using observable behavior.

Template:

## [Requirement ID] — [Feature]

### Given
Initial state and actor.

### When
User/system action.

### Then
Expected observable result.

### Additional Cases
- validation failure
- authorization failure
- empty state
- concurrency/retry behavior
- dependency failure
- boundary values

Example:

## FR-POST-001 — Create Draft

### Given
An authenticated user with post creation permission.

### When
The user submits a valid title and content.

### Then
A draft post is persisted and returned with a stable identifier and slug.

### Additional Cases
- missing required fields are rejected
- unauthorized users receive an authorization error
- duplicate slug behavior follows slug policy
- database failure does not produce a false success response
