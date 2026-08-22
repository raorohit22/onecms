import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CmsCache } from '../../../src/infrastructure/redis/cms-cache';
import mongoose from 'mongoose';

// Mock the redis client
vi.mock('../../../src/infrastructure/redis/connection', () => ({
  redisClient: {
    get: vi.fn(),
    set: vi.fn(),
    keys: vi.fn(),
    del: vi.fn()
  }
}));

import { redisClient } from '../../../src/infrastructure/redis/connection';

describe('CmsCache unit tests', () => {
  const mockTenantContext = {
    organizationId: new mongoose.Types.ObjectId().toString(),
    membershipId: new mongoose.Types.ObjectId().toString(),
    roleIds: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getKey', () => {
    it('should generate a tenant-isolated cache key', () => {
      const key = CmsCache.getKey('post', mockTenantContext, 'list:page1');
      expect(key).toBe(`cms:${mockTenantContext.organizationId}:post:list:page1`);
    });
  });

  describe('getOrSet', () => {
    it('should return cached data if available', async () => {
      const mockData = { title: 'Test Post' };
      vi.mocked(redisClient.get).mockResolvedValueOnce(JSON.stringify(mockData));

      const fallback = vi.fn();
      const result = await CmsCache.getOrSet('test-key', fallback);

      expect(redisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(mockData);
      expect(fallback).not.toHaveBeenCalled();
    });

    it('should call fallback and set cache if data is not cached', async () => {
      vi.mocked(redisClient.get).mockResolvedValueOnce(null);
      const mockData = { title: 'Fresh Post' };
      const fallback = vi.fn().mockResolvedValue(mockData);

      const result = await CmsCache.getOrSet('test-key', fallback, 100);

      expect(redisClient.get).toHaveBeenCalledWith('test-key');
      expect(fallback).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalledWith('test-key', JSON.stringify(mockData), 'EX', 100);
      expect(result).toEqual(mockData);
    });

    it('should handle redis get errors gracefully and still call fallback', async () => {
      vi.mocked(redisClient.get).mockRejectedValueOnce(new Error('Redis Down'));
      const fallback = vi.fn().mockResolvedValue({ ok: true });

      const result = await CmsCache.getOrSet('test-key', fallback);
      
      expect(result).toEqual({ ok: true });
      expect(fallback).toHaveBeenCalled();
    });
  });

  describe('invalidateEntity', () => {
    it('should delete all keys matching the tenant and entity pattern', async () => {
      const keys = [`cms:${mockTenantContext.organizationId}:post:1`, `cms:${mockTenantContext.organizationId}:post:2`];
      vi.mocked(redisClient.keys).mockResolvedValueOnce(keys);

      await CmsCache.invalidateEntity('post', mockTenantContext);

      expect(redisClient.keys).toHaveBeenCalledWith(`cms:${mockTenantContext.organizationId}:post:*`);
      expect(redisClient.del).toHaveBeenCalledWith(...keys);
    });

    it('should not call del if no keys are found', async () => {
      vi.mocked(redisClient.keys).mockResolvedValueOnce([]);

      await CmsCache.invalidateEntity('post', mockTenantContext);

      expect(redisClient.keys).toHaveBeenCalled();
      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });
});
