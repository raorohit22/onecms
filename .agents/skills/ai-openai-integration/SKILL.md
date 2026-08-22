---
name: ai-openai-integration
description: Guidelines for safely integrating the OpenAI API in oneCMS.
---

# AI & OpenAI Integration

## Workflow
1. **Assistive Nature:** AI in oneCMS is strictly assistive. AI generated content must NEVER be automatically published without human editorial review.
2. **Prompts:** Store complex system prompts in dedicated prompt configuration files, not hardcoded inside controllers.
3. **Validation:** All outputs from the OpenAI API must be strictly parsed and validated using Zod schemas before persisting to MongoDB or returning to the client.

## Critical Rules
- **Security:** Do not pass unsanitized user inputs directly into raw evaluation prompts to prevent prompt-injection attacks.
- **Failures:** Implement fallback mechanisms and graceful error messages if the OpenAI API is rate-limited or unavailable. Do not crash the server.
