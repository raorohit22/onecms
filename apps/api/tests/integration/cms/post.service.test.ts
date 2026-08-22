import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../../src/infrastructure/database/connection';
import { Organization, User, Membership, Category, Tag } from '@onecms/db';
import { postService } from '../../../src/modules/cms/services/post.service';
import { ITenantContext } from '../../../src/core/context/tenant-context';
import { AppError } from '../../../src/core/errors/AppError';

describe('PostService Integration Tests & Cross-Tenant Security', () => {
  let mongoServer: MongoMemoryServer;
  let orgA: any, orgB: any;
  let userA: any, userB: any;
  let ctxA: ITenantContext, ctxB: ITenantContext;
  let catA: any, catB: any;
  let tagA: any, tagB: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());

    // Setup Orgs
    orgA = await Organization.create({ name: 'Org A', slug: 'org-a', status: 'ACTIVE' });
    orgB = await Organization.create({ name: 'Org B', slug: 'org-b', status: 'ACTIVE' });

    // Setup Users
    userA = await User.create({ email: 'a@example.com', username: 'usera', passwordHash: 'hash', firstName: 'A', lastName: 'User' });
    userB = await User.create({ email: 'b@example.com', username: 'userb', passwordHash: 'hash', firstName: 'B', lastName: 'User' });

    // Setup Memberships (User A -> Org A, User B -> Org B)
    const memA = await Membership.create({ userId: userA._id, organizationId: orgA._id, status: 'ACTIVE' });
    const memB = await Membership.create({ userId: userB._id, organizationId: orgB._id, status: 'ACTIVE' });

    ctxA = { organizationId: orgA._id.toString(), membershipId: memA._id.toString(), roleIds: [] };
    ctxB = { organizationId: orgB._id.toString(), membershipId: memB._id.toString(), roleIds: [] };

    // Setup Categories & Tags
    catA = await Category.create({ organizationId: orgA._id, name: 'Cat A', slug: 'cat-a' });
    catB = await Category.create({ organizationId: orgB._id, name: 'Cat B', slug: 'cat-b' });
    tagA = await Tag.create({ organizationId: orgA._id, name: 'Tag A', slug: 'tag-a' });
    tagB = await Tag.create({ organizationId: orgB._id, name: 'Tag B', slug: 'tag-b' });
  }, 120000);

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await disconnectDB();
    await mongoServer.stop();
  });

  it('creates a post successfully with valid tenant references', async () => {
    const post = await postService.createPost({
      authorId: userA._id,
      categoryIds: [catA._id],
      tagIds: [tagA._id],
      title: 'Valid Post',
      slug: 'valid-post',
      excerpt: '',
      content: 'Content',
      status: 'DRAFT',
      publishedAt: null
    }, ctxA);

    expect(post._id).toBeDefined();
    expect(post.organizationId.toString()).toBe(orgA._id.toString());
  });

  it('rejects post creation if author belongs to another organization', async () => {
    // Attempting to create a post in Org A context, but assigning userB (who is in Org B) as the author.
    await expect(postService.createPost({
      authorId: userB._id,
      categoryIds: [catA._id],
      tagIds: [tagA._id],
      title: 'Hacked Author',
      slug: 'hacked-author',
      excerpt: '',
      content: 'Content',
      status: 'DRAFT',
      publishedAt: null
    }, ctxA)).rejects.toThrowError(AppError);
  });

  it('rejects post creation if a category belongs to another organization', async () => {
    // Context is Org A, but category is catB (Org B)
    await expect(postService.createPost({
      authorId: userA._id,
      categoryIds: [catB._id],
      tagIds: [tagA._id],
      title: 'Hacked Cat',
      slug: 'hacked-cat',
      excerpt: '',
      content: 'Content',
      status: 'DRAFT',
      publishedAt: null
    }, ctxA)).rejects.toThrowError(AppError);
  });

  it('rejects post creation if a tag belongs to another organization', async () => {
    await expect(postService.createPost({
      authorId: userA._id,
      categoryIds: [catA._id],
      tagIds: [tagB._id],
      title: 'Hacked Tag',
      slug: 'hacked-tag',
      excerpt: '',
      content: 'Content',
      status: 'DRAFT',
      publishedAt: null
    }, ctxA)).rejects.toThrowError(AppError);
  });

  it('automatically sets publishedAt when creating a PUBLISHED post without one', async () => {
    const post = await postService.createPost({
      authorId: userA._id,
      categoryIds: [],
      tagIds: [],
      title: 'Auto Publish',
      slug: 'auto-publish',
      excerpt: '',
      content: 'Content',
      status: 'PUBLISHED',
      publishedAt: null
    }, ctxA);

    expect(post.publishedAt).toBeDefined();
    expect(post.publishedAt).toBeInstanceOf(Date);
  });

  it('maps E11000 slug conflicts to AppError(409)', async () => {
    await expect(postService.createPost({
      authorId: userA._id,
      categoryIds: [],
      tagIds: [],
      title: 'Dup Post',
      slug: 'valid-post', // already created in test 1
      excerpt: '',
      content: 'Content',
      status: 'DRAFT',
      publishedAt: null
    }, ctxA)).rejects.toThrowError(AppError);
  });

  it('isolates cross-tenant updates and reads', async () => {
    const post = await postService.createPost({
      authorId: userA._id,
      categoryIds: [],
      tagIds: [],
      title: 'Isolated Post',
      slug: 'isolated-post',
      excerpt: '',
      content: 'Content',
      status: 'DRAFT',
      publishedAt: null
    }, ctxA);

    // ctxB cannot read it
    await expect(postService.getPostById(post._id.toString(), ctxB)).rejects.toThrowError(AppError);

    // ctxB cannot update it
    await expect(postService.updatePost(post._id.toString(), { title: 'Hacked Title' }, ctxB)).rejects.toThrowError(AppError);

    // ctxB cannot delete it
    await expect(postService.deletePost(post._id.toString(), ctxB)).rejects.toThrowError(AppError);

    // ctxA can update it
    const updated = await postService.updatePost(post._id.toString(), { title: 'Updated Title' }, ctxA);
    expect(updated.title).toBe('Updated Title');
  });

  it('prevents injecting cross-tenant references during update', async () => {
    const post = await postService.createPost({
      authorId: userA._id,
      categoryIds: [],
      tagIds: [],
      title: 'Safe Update',
      slug: 'safe-update',
      excerpt: '',
      content: 'Content',
      status: 'DRAFT',
      publishedAt: null
    }, ctxA);

    // Injecting userB (Org B) into post in Org A
    await expect(postService.updatePost(post._id.toString(), { authorId: userB._id }, ctxA)).rejects.toThrowError(AppError);

    // Injecting catB
    await expect(postService.updatePost(post._id.toString(), { categoryIds: [catB._id] }, ctxA)).rejects.toThrowError(AppError);

    // Injecting tagB
    await expect(postService.updatePost(post._id.toString(), { tagIds: [tagB._id] }, ctxA)).rejects.toThrowError(AppError);
  });
});
