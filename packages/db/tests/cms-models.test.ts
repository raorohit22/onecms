import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../src/connection';
import { Post, Category, Tag, Organization, User } from '../src';
import mongoose from 'mongoose';

describe('CMS Database Domain Models', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectDB(uri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await disconnectDB();
    await mongoServer.stop();
  });

  it('validates Category creation and required fields', async () => {
    const orgId = new mongoose.Types.ObjectId();
    const category = new Category({
      organizationId: orgId,
      name: 'Technology',
      slug: 'technology',
    });
    
    const saved = await category.save();
    expect(saved._id).toBeDefined();
    expect(saved.name).toBe('Technology');
    
    // Missing required fields
    const invalidCat = new Category({ name: 'Invalid' });
    await expect(invalidCat.validate()).rejects.toThrow();
  });

  it('validates Tag creation and required fields', async () => {
    const orgId = new mongoose.Types.ObjectId();
    const tag = new Tag({
      organizationId: orgId,
      name: 'NodeJS',
      slug: 'nodejs',
    });
    
    const saved = await tag.save();
    expect(saved._id).toBeDefined();
    expect(saved.name).toBe('NodeJS');
    
    const invalidTag = new Tag({ slug: 'invalid' });
    await expect(invalidTag.validate()).rejects.toThrow();
  });

  it('validates Post creation, status, relationships, optional fields, and SEO', async () => {
    const orgId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();
    const tagId = new mongoose.Types.ObjectId();
    const mediaId = new mongoose.Types.ObjectId();

    const post = new Post({
      organizationId: orgId,
      authorId: authorId,
      categoryIds: [categoryId],
      tagIds: [tagId],
      featuredMediaId: mediaId,
      title: 'Hello World',
      slug: 'hello-world',
      content: '<p>This is my first post!</p>',
      excerpt: 'First post',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      seo: {
        metaTitle: 'Hello World SEO',
        metaDescription: 'SEO Desc',
        canonicalUrl: 'https://example.com/hello-world',
        ogImage: 'img.jpg',
        noIndex: false
      }
    });

    const saved = await post.save();
    expect(saved._id).toBeDefined();
    expect(saved.status).toBe('PUBLISHED');
    expect(saved.seo?.metaTitle).toBe('Hello World SEO');
    expect(saved.categoryIds[0].toString()).toBe(categoryId.toString());
    expect(saved.tagIds[0].toString()).toBe(tagId.toString());
    expect(saved.featuredMediaId?.toString()).toBe(mediaId.toString());
    expect(saved.createdAt).toBeDefined();
    expect(saved.updatedAt).toBeDefined();

    // Invalid Status
    const invalidPost = new Post({
      organizationId: orgId,
      authorId: authorId,
      title: 'Invalid Status',
      slug: 'invalid-status',
      content: 'Content',
      status: 'INVALID_STATUS'
    });
    await expect(invalidPost.validate()).rejects.toThrow();
  });

  describe('Tenant Boundary & Unique Constraints', () => {
    it('enforces slug uniqueness within the SAME organization for Posts', async () => {
      const orgId = new mongoose.Types.ObjectId();
      const authorId = new mongoose.Types.ObjectId();
      
      const post1 = new Post({
        organizationId: orgId,
        authorId: authorId,
        title: 'Post One',
        slug: 'duplicate-slug',
        content: 'Content'
      });
      await post1.save();

      const post2 = new Post({
        organizationId: orgId, // Same organization
        authorId: authorId,
        title: 'Post Two',
        slug: 'duplicate-slug', // Same slug
        content: 'Content'
      });
      
      await expect(post2.save()).rejects.toThrow(/E11000 duplicate key error/);
    });

    it('allows identical slugs across DIFFERENT organizations for Posts', async () => {
      const orgA = new mongoose.Types.ObjectId();
      const orgB = new mongoose.Types.ObjectId();
      const authorId = new mongoose.Types.ObjectId();

      const postA = new Post({
        organizationId: orgA,
        authorId: authorId,
        title: 'Org A Post',
        slug: 'shared-slug',
        content: 'Content'
      });
      await postA.save();

      const postB = new Post({
        organizationId: orgB, // Different organization
        authorId: authorId,
        title: 'Org B Post',
        slug: 'shared-slug', // Same slug
        content: 'Content'
      });
      
      // Should succeed because they belong to different organizations
      const savedB = await postB.save();
      expect(savedB._id).toBeDefined();
    });

    it('enforces slug uniqueness within the SAME organization for Categories', async () => {
      const orgId = new mongoose.Types.ObjectId();
      
      const cat1 = new Category({ organizationId: orgId, name: 'Cat 1', slug: 'dup-cat' });
      await cat1.save();

      const cat2 = new Category({ organizationId: orgId, name: 'Cat 2', slug: 'dup-cat' });
      await expect(cat2.save()).rejects.toThrow(/E11000 duplicate key error/);
    });

    it('allows identical slugs across DIFFERENT organizations for Categories', async () => {
      const orgA = new mongoose.Types.ObjectId();
      const orgB = new mongoose.Types.ObjectId();

      const catA = new Category({ organizationId: orgA, name: 'Cat A', slug: 'shared-cat' });
      await catA.save();

      const catB = new Category({ organizationId: orgB, name: 'Cat B', slug: 'shared-cat' });
      const savedB = await catB.save();
      expect(savedB._id).toBeDefined();
    });

    it('enforces slug uniqueness within the SAME organization for Tags', async () => {
      const orgId = new mongoose.Types.ObjectId();
      
      const tag1 = new Tag({ organizationId: orgId, name: 'Tag 1', slug: 'dup-tag' });
      await tag1.save();

      const tag2 = new Tag({ organizationId: orgId, name: 'Tag 2', slug: 'dup-tag' });
      await expect(tag2.save()).rejects.toThrow(/E11000 duplicate key error/);
    });

    it('allows identical slugs across DIFFERENT organizations for Tags', async () => {
      const orgA = new mongoose.Types.ObjectId();
      const orgB = new mongoose.Types.ObjectId();

      const tagA = new Tag({ organizationId: orgA, name: 'Tag A', slug: 'shared-tag' });
      await tagA.save();

      const tagB = new Tag({ organizationId: orgB, name: 'Tag B', slug: 'shared-tag' });
      const savedB = await tagB.save();
      expect(savedB._id).toBeDefined();
    });
  });
});
