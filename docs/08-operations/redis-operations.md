# Redis Operations

Redis requires strict memory management and failure handling.

## Deployment Profile
- **High Availability**: Use Redis Sentinel or Redis Cluster in production to ensure failure does not lock the application.
- **Memory Policy**: `volatile-lru` or `allkeys-lru` is recommended. Since all auth/rate-limit keys are configured with an explicit TTL, eviction should rarely be necessary, but this provides a safety net against memory exhaustion during DDOS attacks.

## Common Operations

### Complete Session Invalidation (Emergency)
If a system-wide compromise is suspected or a critical vulnerability is patched, you can clear all active sessions and refresh tokens:
```bash
redis-cli --scan --pattern "auth:*" | xargs redis-cli del
```
*Note: This will force all users to log in again immediately.*

### Rate Limit Reset
To reset rate limits for a specific IP blocking genuine traffic:
```bash
redis-cli --scan --pattern "rate:*:<IP_ADDRESS>" | xargs redis-cli del
```
