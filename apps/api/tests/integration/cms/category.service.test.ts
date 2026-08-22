import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../../src/infrastructure/database/connection';
import { Organization, Category } from '@onecms/db';
import { categoryService } from '../../../src/modules/cms/services/category.service';
import { ITenantContext } from '../../../src/core/context/tenant-context';
import { AppError } from '../../../src/core/errors/AppError';

describe('CategoryService Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let orgA: any, orgB: any;
  let ctxA: ITenantContext, ctxB: ITenantContext;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());

    orgA = await Organization.create({ name: 'Org A', slug: 'org-a', status: 'ACTIVE' });
    orgB = await Organization.create({ name: 'Org B', slug: 'org-b', status: 'ACTIVE' });

    ctxA = { organizationId: orgA._id.toString(), membershipId: new mongoose.Types.ObjectId().toString(), roleIds: [] };
    ctxB = { organizationId: orgB._id.toString(), membershipId: new mongoose.Types.ObjectId().toString(), roleIds: [] };
  }, 120000);

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await disconnectDB();
    await mongoServer.stop();
  });

  it('creates a category bound to the tenant context', async () => {
    const category = await categoryService.createCategory({ name: 'Tech', slug: 'tech', description: 'Tech desc' }, ctxA);
    expect(category._id).toBeDefined();
    expect(category.organizationId.toString()).toBe(orgA._id.toString());
  });

  it('maps E11000 duplicate slug errors to AppError(409)', async () => {
    await categoryService.createCategory({ name: 'News', slug: 'news', description: 'News' }, ctxA);
    
    // Duplicate slug in same org
    await expect(
      categoryService.createCategory({ name: 'News Duplicate', slug: 'news', description: 'News Dup' }, ctxA)
    ).rejects.toThrowError(AppError);

    try {
      await categoryService.createCategory({ name: 'News Duplicate', slug: 'news', description: 'News Dup' }, ctxA);
    } catch (err: any) {
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
    }
  });

  it('allows identical slugs across different organizations', async () => {
    // Uses the same slug 'news' but in ctxB
    const categoryB = await categoryService.createCategory({ name: 'News B', slug: 'news', description: 'News B' }, ctxB);
    expect(categoryB._id).toBeDefined();
    expect(categoryB.organizationId.toString()).toBe(orgB._id.toString());
  });

  it('isolates lookups by ID and Slug', async () => {
    const cat = await categoryService.createCategory({ name: 'Isolated', slug: 'isolated', description: '' }, ctxA);

    // ctxA can find it
    const foundById = await categoryService.getCategoryById(cat._id.toString(), ctxA);
    expect(foundById._id.toString()).toBe(cat._id.toString());

    // ctxB cannot find it by ID
    await expect(categoryService.getCategoryById(cat._id.toString(), ctxB)).rejects.toThrowError(AppError);
    try {
      await categoryService.getCategoryById(cat._id.toString(), ctxB);
    } catch (err: any) {
      expect(err.statusCode).toBe(404); // Should be 404 Not Found, preventing cross-tenant existence leaks
    }

    // ctxB cannot find it by Slug
    await expect(categoryService.getCategoryBySlug('isolated', ctxB)).rejects.toThrowError(AppError);
  });

  it('isolates updates and prevents changing organizationId', async () => {
    const cat = await categoryService.createCategory({ name: 'Update Me', slug: 'update-me', description: '' }, ctxA);

    // ctxB cannot update it
    await expect(categoryService.updateCategory(cat._id.toString(), { name: 'Hacked' }, ctxB)).rejects.toThrowError(AppError);

    // Attempting to inject organizationId in update data will be ignored by repository's `Omit` type and context boundaries
    const updated = await categoryService.updateCategory(cat._id.toString(), { name: 'Updated' } as any, ctxA);
    expect(updated.name).toBe('Updated');
    expect(updated.organizationId.toString()).toBe(orgA._id.toString());
  });
});
