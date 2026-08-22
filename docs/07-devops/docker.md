# Docker Strategy

Docker will provide reproducible development/CI/production environments where appropriate.

Guidelines:
- minimal images
- non-root processes where practical
- pinned major/runtime expectations
- health checks
- no secrets baked into images
- multi-stage builds for production
