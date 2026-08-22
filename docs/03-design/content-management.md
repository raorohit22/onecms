# Content Management Design

Post lifecycle:

DRAFT → REVIEW/READY (optional) → PUBLISHED

The initial implementation may start with DRAFT/PUBLISHED and evolve only if requirements justify a review state.

Content model must separate:
- editorial content
- SEO metadata
- publication metadata
- system metadata

Slug changes require an explicit URL/redirect policy before implementation.
