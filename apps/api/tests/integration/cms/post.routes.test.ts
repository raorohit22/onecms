import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../../../src/app';
import { connectDB, disconnectDB } from '../../../src/infrastructure/database/connection';
import { connectRedis, disconnectRedis } from '../../../src/infrastructure/redis/connection';
import { Organization, Membership, User, Permission, Role, Category } from '@onecms/db';
import { sessionService } from '../../../src/modules/auth/session.service';

const app = createApp();

describe('Post Routes Integration', () => {
  let mongoServer: MongoMemoryServer;
  let redisServer: RedisMemoryServer;
  let userA: any, userB: any, orgA: any, orgB: any, sessionA: string, sessionB: string;
  let catAId: string;
  let postAId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());

    redisServer = await RedisMemoryServer.create();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();
    await connectRedis(`redis://${host}:${port}`);

    userA = await User.create({ email: 'post_a@example.com', passwordHash: 'hash', status: 'ACTIVE' });
    userB = await User.create({ email: 'post_b@example.com', passwordHash: 'hash', status: 'ACTIVE' });
    orgA = await Organization.create({ name: 'Org A Post', slug: 'org-a-post', status: 'ACTIVE' });
    orgB = await Organization.create({ name: 'Org B Post', slug: 'org-b-post', status: 'ACTIVE' });

    const permCreate = await Permission.create({ action: 'CREATE', resource: 'POST', isSystem: true });
    const permRead = await Permission.create({ action: 'READ', resource: 'POST', isSystem: true });
    const permUpdate = await Permission.create({ action: 'UPDATE', resource: 'POST', isSystem: true });
    const permDelete = await Permission.create({ action: 'DELETE', resource: 'POST', isSystem: true });

    const roleA = await Role.create({
      organizationId: orgA._id,
      name: 'Admin',
      scope: 'ORGANIZATION',
      permissionIds: [permCreate._id, permRead._id, permUpdate._id, permDelete._id],
    });
    const roleB = await Role.create({
      organizationId: orgB._id,
      name: 'Admin',
      scope: 'ORGANIZATION',
      permissionIds: [permCreate._id, permRead._id, permUpdate._id, permDelete._id],
    });

    await Membership.create({ userId: userA._id, organizationId: orgA._id, roleIds: [roleA._id], status: 'ACTIVE' });
    await Membership.create({ userId: userB._id, organizationId: orgB._id, roleIds: [roleB._id], status: 'ACTIVE' });

    sessionA = await sessionService.createSession(userA._id.toString(), {});
    sessionB = await sessionService.createSession(userB._id.toString(), {});

    const catA = await Category.create({ organizationId: orgA._id, name: 'Cat A', slug: 'cat-a' });
    catAId = catA._id.toString();
  }, 120000);

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await disconnectDB();
    if (mongoServer) await mongoServer.stop();
    await disconnectRedis();
    if (redisServer) await redisServer.stop();
  });

  it('creates post successfully', async () => {
    const res = await request(app)
      .post('/post')
      .set('Authorization', `Bearer ${sessionA}`)
      .set('X-Organization-Id', orgA._id.toString())
      .send({
        title: 'My Post',
        slug: 'my-post',
        content: 'Hello World',
        status: 'DRAFT',
        authorId: userA._id.toString(),
        categoryIds: [catAId],
      });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('my-post');
    expect(res.body.authorId).toBe(userA._id.toString());
    postAId = res.body._id;
  });

  it('rejects cross-tenant categories in post creation (returns 400)', async () => {
    const res = await request(app)
      .post('/post')
      .set('Authorization', `Bearer ${sessionA}`)
      .set('X-Organization-Id', orgA._id.toString())
      .send({
        title: 'Hacked Post',
        slug: 'hacked-post',
        content: 'Evil',
        status: 'DRAFT',
        authorId: userB._id.toString(),
        categoryIds: [catAId], // catA belongs to orgA
      });
    
    expect(res.status).toBe(400); // Service logic catches relationship violation
  });

  it('rejects duplicate slugs (returns 409)', async () => {
    const res = await request(app)
      .post('/post')
      .set('Authorization', `Bearer ${sessionA}`)
      .set('X-Organization-Id', orgA._id.toString())
      .send({ title: 'My Post', slug: 'my-post', content: 'World', status: 'DRAFT', authorId: userA._id.toString() });
    
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects cross-tenant patch (returns 404)', async () => {
    const res = await request(app)
      .patch(`/post/${postAId}`)
      .set('Authorization', `Bearer ${sessionB}`)
      .set('X-Organization-Id', orgB._id.toString())
      .send({ title: 'Hacked' });
    
    expect(res.status).toBe(404);
  });

  it('lists posts respecting tenant boundaries', async () => {
    const res = await request(app)
      .get('/posts?limit=10')
      .set('Authorization', `Bearer ${sessionB}`)
      .set('X-Organization-Id', orgB._id.toString());
    
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0); // Org B has no posts
  });
});
