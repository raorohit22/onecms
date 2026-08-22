# Deployment Architecture

Initial production topology may consist of:

Internet
→ reverse proxy/CDN
→ public Next.js application
→ Express API
→ MongoDB Atlas
→ Redis
→ object storage

Workers run separately from API processes when background jobs are introduced.

The exact hosting provider is intentionally not locked in during Phase 0.
