# Redis Architecture

Redis is used in oneCMS as an ephemeral, fast-access state store primarily for the security, session, and rate-limiting subsystems.

**Core Tenet:**
MongoDB is the authoritative persistent source of truth. Redis is never the single source of truth for durable entities. If Redis suffers complete data loss, all active user sessions will be logged out, but no persistent data (users, roles, permissions) will be affected.

## Key Design Principles

1. **Namespace Separation**
   All Redis keys must be generated using `RedisKeyFactory`. No magic strings are allowed.
   Keys follow the `domain:entity:identifier` format (e.g., `auth:session:123`, `rate:ip:192.168.1.1`).

2. **Ephemeral Lifespan**
   Every record written to Redis must have an explicit Time-to-Live (TTL). Permanent keys are forbidden to prevent unbounded memory growth.

3. **Failure Policy (Fail-Closed)**
   Security operations must "fail-closed" when Redis is unavailable:
   - Rate Limit evaluation -> 503/429
   - Refresh token validation -> 401 Unauthorized
   - Session validation -> 401 Unauthorized
   This prevents an attacker from DOS-ing Redis to bypass abuse limits or session revocation checks.

4. **Performance & Atomicity**
   We utilize `ioredis` due to its robust reconnection strategies and pipeline support. When multi-step modifications are required (e.g., token-bucket rate limits), Redis transactions (`multi`/`exec`) or Lua scripts are used to prevent race conditions.
