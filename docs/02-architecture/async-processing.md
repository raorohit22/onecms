# Asynchronous Processing

Use Redis + BullMQ for work that should not block an HTTP request.

Candidates:
- image processing
- AI generation when long-running
- search/index refresh
- sitemap generation
- cleanup jobs
- notifications if later introduced

Jobs must define:
- payload schema
- retry policy
- backoff
- timeout
- idempotency strategy
- failure handling
- observability
