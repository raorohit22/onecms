import { redisClient } from './connection';
import { ITenantContext } from '@api/core/context/tenant-context';
import { logger } from '@api/core/logger/logger';

/**
 * Cache-Aside Utility for CMS Entities.
 * Enforces Tenant Isolation in Cache Keys.
 */
export class CmsCache {
  private static readonly TTL_SECONDS = 300; // 5 minutes

  /**
   * Generates a safe, tenant-isolated cache key.
   * e.g. cms:org123:category:list:page1_limit10
   */
  static getKey(entity: string, context: ITenantContext, suffix: string): string {
    return `cms:${context.organizationId}:${entity}:${suffix}`;
  }

  /**
   * Fetches from cache, or executes the fallback function and caches the result.
   */
  static async getOrSet<T>(key: string, fallback: () => Promise<T>, ttl: number = this.TTL_SECONDS): Promise<T> {
    if (!redisClient) return fallback();

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      logger.warn(`Redis get error for key ${key}: ${err}`);
    }

    const result = await fallback();

    try {
      if (result) {
        await redisClient.set(key, JSON.stringify(result), 'EX', ttl);
      }
    } catch (err) {
      logger.warn(`Redis set error for key ${key}: ${err}`);
    }

    return result;
  }

  /**
   * Invalidates all cache keys for a specific entity within a tenant context.
   * Uses non-blocking cursor-based SCAN to safely delete keys without locking the Redis event loop in production.
   */
  static async invalidateEntity(entity: string, context: ITenantContext): Promise<void> {
    if (!redisClient) return;

    try {
      const pattern = `cms:${context.organizationId}:${entity}:*`;
      let cursor = '0';
      const keysToDelete: string[] = [];

      do {
        const [nextCursor, matchedKeys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (matchedKeys && matchedKeys.length > 0) {
          keysToDelete.push(...matchedKeys);
        }
      } while (cursor !== '0');

      if (keysToDelete.length > 0) {
        await redisClient.del(...keysToDelete);
      }
    } catch (err) {
      logger.warn(`Redis invalidation error for entity ${entity}: ${err}`);
    }
  }
}
