# AI Content Workflow

1. User selects AI operation.
2. CMS sends validated request to API.
3. API authorizes operation.
4. AI service builds versioned prompt.
5. Provider adapter calls model.
6. Response is parsed.
7. Structured output is schema-validated.
8. Business validation is applied.
9. Generation metadata is recorded.
10. Result is returned to editable CMS context.
11. Human reviews/edits.
12. User explicitly saves/publishes.

AI cannot directly bypass editorial authorization.
