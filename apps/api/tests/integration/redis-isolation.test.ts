import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RedisMemoryServer } from 'redis-memory-server';
import { connectRedis, disconnectRedis, redisClient } from '../../../src/infrastructure/redis/connection';
import { CmsCache } from '../../../src/infrastructure/redis/cms-cache';
import mongoose from 'mongoose';

describe('Redis Cache Tenant Isolation & Pressure', () => {
  let redisServer: RedisMemoryServer;

  beforeAll(async () => {
    redisServer = await RedisMemoryServer.create();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();
    await connectRedis(`redis://${host}:${port}`);
  });

  afterAll(async () => {
    await disconnectRedis();
    if (redisServer) await redisServer.stop();
  });

  it('maintains absolute isolation between tenants under concurrent read/write pressure', async () => {
    const org1 = {
      organizationId: new mongoose.Types.ObjectId().toString(),
      membershipId: new mongoose.Types.ObjectId().toString(),
      roleIds: []
    };
    const org2 = {
      organizationId: new mongoose.Types.ObjectId().toString(),
      membershipId: new mongoose.Types.ObjectId().toString(),
      roleIds: []
    };

    // Simulate 100 concurrent requests from both organizations hitting the same "entity" and "suffix"
    const promises = [];
    for (let i = 0; i < 100; i++) {
      // Org 1 Request
      promises.push(
        CmsCache.getOrSet(
          CmsCache.getKey('dashboard', org1, 'stats'),
          async () => ({ sensitiveData: `Org1-Data-${i}` }),
          60
        )
      );
      // Org 2 Request
      promises.push(
        CmsCache.getOrSet(
          CmsCache.getKey('dashboard', org2, 'stats'),
          async () => ({ sensitiveData: `Org2-Data-${i}` }),
          60
        )
      );
    }

    await Promise.all(promises);

    // Verify Org 1 cache does NOT contain Org 2 data
    const org1Data = await CmsCache.getOrSet(CmsCache.getKey('dashboard', org1, 'stats'), async () => null);
    const org2Data = await CmsCache.getOrSet(CmsCache.getKey('dashboard', org2, 'stats'), async () => null);

    expect(org1Data).toBeDefined();
    expect(org1Data?.sensitiveData).toContain('Org1-Data');
    
    expect(org2Data).toBeDefined();
    expect(org2Data?.sensitiveData).toContain('Org2-Data');

    expect(org1Data?.sensitiveData).not.toEqual(org2Data?.sensitiveData);
  });

  it('invalidating one tenant does not affect another', async () => {
    const org1 = { organizationId: 'tenant-a', membershipId: 'm1', roleIds: [] };
    const org2 = { organizationId: 'tenant-b', membershipId: 'm2', roleIds: [] };

    await redisClient!.set(`cms:tenant-a:post:1`, 'secret-a');
    await redisClient!.set(`cms:tenant-b:post:1`, 'secret-b');

    // Invalidate tenant-a posts
    await CmsCache.invalidateEntity('post', org1);

    const aLeft = await redisClient!.get(`cms:tenant-a:post:1`);
    const bLeft = await redisClient!.get(`cms:tenant-b:post:1`);

    expect(aLeft).toBeNull();
    expect(bLeft).toBe('secret-b');
  });
});
