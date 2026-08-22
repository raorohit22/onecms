# AI Security

AI threats considered:
- prompt injection
- malicious content submitted as input
- sensitive data leakage
- model output manipulation
- excessive token/cost consumption
- unsafe generated markup
- provider outages

Controls:
- server-side provider calls
- strict input boundaries
- output schema validation
- content sanitization where HTML is involved
- authorization
- usage limits
- logging without sensitive prompt content where inappropriate
- human review before publication
