# Caching Architecture

Caching will be introduced only after access patterns are measured.

Potential layers:
- Next.js rendering/revalidation cache
- Redis application cache
- database indexes

Rules:
- define cache key
- define TTL/invalidation
- avoid caching authorization-sensitive data incorrectly
- invalidate after relevant writes
- prefer correctness over speculative caching
