# AI Architecture

AI is an application capability, not a UI concern.

Flow:

CMS
→ API
→ AI application service
→ provider adapter
→ model
→ structured response
→ schema validation
→ business validation
→ editor/draft

Rules:
- provider credentials remain server-side
- prompts are versioned
- output schemas are explicit
- failures/timeouts are handled
- token/cost metadata is tracked where available
- AI content is not automatically published
- prompt injection and untrusted content are considered
