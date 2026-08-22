import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RedisMemoryServer } from 'redis-memory-server';
import { connectRedis, disconnectRedis, redisClient } from '@api/infrastructure/redis/connection';

describe('Redis Integration', () => {
  let redisServer: RedisMemoryServer;

  beforeAll(async () => {
    // Start an in-memory Redis instance
    redisServer = await RedisMemoryServer.create();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();
    const uri = `redis://${host}:${port}`;
    
    // Connect using the test URI
    await connectRedis(uri);
  });

  afterAll(async () => {
    // Disconnect and stop the server
    await disconnectRedis();
    await redisServer.stop();
  });

  it('should establish a connection to Redis', async () => {
    expect(redisClient).toBeDefined();
    expect(redisClient?.status).toBe('ready');
  });

  it('should be able to set and get a value', async () => {
    await redisClient?.set('test-key', 'test-value');
    const value = await redisClient?.get('test-key');
    expect(value).toBe('test-value');
  });
});
