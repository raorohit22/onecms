import { redisClient } from '@api/infrastructure/redis/connection';
import { AppError } from '@api/core/errors/AppError';
import { logger } from '@api/core/logger/logger';

export const rateLimitService = {
  /**
   * Evaluates a rate limit using a simple fixed-window counter.
   * If Redis is down, we "fail-closed" to prevent bypass.
   * 
   * @param key The specific rate limit key (e.g. from RedisKeyFactory.rateLimitIp)
   * @param maxRequests Maximum allowed requests in the window
   * @param windowSeconds Duration of the window in seconds
   */
  async consume(key: string, maxRequests: number, windowSeconds: number): Promise<void> {
    if (!redisClient) {
      throw new AppError(503, 'Service unavailable (Rate limiter offline)', 'RATE_LIMITER_OFFLINE');
    }

    try {
      const pipeline = redisClient.pipeline();
      
      // Increment the counter
      pipeline.incr(key);
      // Set TTL if it doesn't have one
      pipeline.ttl(key);
      
      const results = await pipeline.exec();
      if (!results) {
        throw new Error('Pipeline execution failed');
      }

      const count = results[0]?.[1] as number;
      const ttl = results[1]?.[1] as number;

      // If it's a new key, set its expiration
      if (ttl === -1 || ttl === -2) {
        await redisClient.expire(key, windowSeconds);
      }

      if (count > maxRequests) {
        logger.warn({ key, count, maxRequests }, 'Rate limit exceeded');
        throw new AppError(429, 'Too many requests, please try again later', 'RATE_LIMIT_EXCEEDED');
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      
      // Fail closed on Redis error to prevent abuse
      logger.error({ err, key }, 'Rate limiter failed to evaluate');
      throw new AppError(503, 'Service temporarily unavailable', 'RATE_LIMITER_ERROR');
    }
  }
};
