import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../../src/infrastructure/database/connection';
import { Organization } from '@onecms/db';
import { tagService } from '../../../src/modules/cms/services/tag.service';
import { ITenantContext } from '../../../src/core/context/tenant-context';
import { AppError } from '../../../src/core/errors/AppError';

describe('TagService Integration Tests', () => {
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

  it('creates a tag bound to the tenant context', async () => {
    const tag = await tagService.createTag({ name: 'NodeJS', slug: 'nodejs' }, ctxA);
    expect(tag._id).toBeDefined();
    expect(tag.organizationId.toString()).toBe(orgA._id.toString());
  });

  it('maps E11000 duplicate slug errors to AppError(409)', async () => {
    await tagService.createTag({ name: 'React', slug: 'react' }, ctxA);
    
    await expect(
      tagService.createTag({ name: 'React Duplicate', slug: 'react' }, ctxA)
    ).rejects.toThrowError(AppError);

    try {
      await tagService.createTag({ name: 'React Duplicate', slug: 'react' }, ctxA);
    } catch (err: any) {
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
    }
  });

  it('allows identical slugs across different organizations', async () => {
    const tagB = await tagService.createTag({ name: 'React B', slug: 'react' }, ctxB);
    expect(tagB._id).toBeDefined();
    expect(tagB.organizationId.toString()).toBe(orgB._id.toString());
  });

  it('isolates lookups by ID and Slug', async () => {
    const tag = await tagService.createTag({ name: 'Isolated', slug: 'isolated' }, ctxA);

    const foundById = await tagService.getTagById(tag._id.toString(), ctxA);
    expect(foundById._id.toString()).toBe(tag._id.toString());

    await expect(tagService.getTagById(tag._id.toString(), ctxB)).rejects.toThrowError(AppError);
    await expect(tagService.getTagBySlug('isolated', ctxB)).rejects.toThrowError(AppError);
  });
});
