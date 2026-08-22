# Monitoring

Monitor:
- API availability
- latency
- error rate
- worker failures
- queue depth
- database health
- external provider failures
- AI usage/cost where available

Use health/readiness endpoints for service availability.

## Health Endpoints

- `GET /health` and `GET /health/live`: Process liveness. Returns `200 OK` if the Node.js process is alive, regardless of database or external dependency states.
- `GET /health/ready`: Dependency readiness. Returns `200 OK` if MongoDB is successfully connected. Returns `503 Service Unavailable` if dependencies are degraded or disconnected. (Note: Internal connection topologies, stack traces, and credentials are never exposed via these endpoints for security reasons).
