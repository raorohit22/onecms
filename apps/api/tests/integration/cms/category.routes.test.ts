import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../../../src/app';
import { connectDB, disconnectDB } from '../../../src/infrastructure/database/connection';
import { connectRedis, disconnectRedis } from '../../../src/infrastructure/redis/connection';
import { Organization, Membership, User, Permission, Role } from '@onecms/db';
import { sessionService } from '../../../src/modules/auth/session.service';

const app = createApp();

describe('Category Routes Integration', () => {
  let mongoServer: MongoMemoryServer;
  let redisServer: RedisMemoryServer;
  let userA: any, userB: any, orgA: any, orgB: any, sessionA: string, sessionB: string;
  let catAId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());

    redisServer = await RedisMemoryServer.create();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();
    await connectRedis(`redis://${host}:${port}`);

    // Seed data
    userA = await User.create({ email: 'a@example.com', passwordHash: 'hash', status: 'ACTIVE' });
    userB = await User.create({ email: 'b@example.com', passwordHash: 'hash', status: 'ACTIVE' });
    orgA = await Organization.create({ name: 'Org A', slug: 'org-a', status: 'ACTIVE' });
    orgB = await Organization.create({ name: 'Org B', slug: 'org-b', status: 'ACTIVE' });

    // Seed permissions & roles for testing
    const permCreate = await Permission.create({ action: 'CREATE', resource: 'CATEGORY', isSystem: true });
    const permRead = await Permission.create({ action: 'READ', resource: 'CATEGORY', isSystem: true });
    const permUpdate = await Permission.create({ action: 'UPDATE', resource: 'CATEGORY', isSystem: true });
    const permDelete = await Permission.create({ action: 'DELETE', resource: 'CATEGORY', isSystem: true });

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
  }, 120000);

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await disconnectDB();
    if (mongoServer) await mongoServer.stop();
    await disconnectRedis();
    if (redisServer) await redisServer.stop();
  });

  it('fails if unauthenticated', async () => {
    const res = await request(app).post('/cms/categories').set('X-Organization-Id', orgA._id.toString()).send({});
    expect(res.status).toBe(401);
  });

  it('fails if missing tenant context', async () => {
    const res = await request(app).post('/category').set('Authorization', `Bearer ${sessionA}`).send({});
    expect(res.status).toBe(403); // From requireOrganizationContext
  });

  it('fails validation on invalid body', async () => {
    const res = await request(app)
      .post('/category')
      .set('Authorization', `Bearer ${sessionA}`)
      .set('X-Organization-Id', orgA._id.toString())
      .send({ name: 'Bad Slug', slug: 'INVALID SLUG!' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates category successfully', async () => {
    const res = await request(app)
      .post('/category')
      .set('Authorization', `Bearer ${sessionA}`)
      .set('X-Organization-Id', orgA._id.toString())
      .send({ name: 'Tech', slug: 'tech', description: 'Tech category' });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('tech');
    catAId = res.body._id;
  });

  it('rejects cross-tenant read (returns 404)', async () => {
    const res = await request(app)
      .get(`/category/${catAId}`)
      .set('Authorization', `Bearer ${sessionB}`)
      .set('X-Organization-Id', orgB._id.toString());
    
    expect(res.status).toBe(404);
  });

  it('rejects duplicate slugs (returns 409)', async () => {
    const res = await request(app)
      .post('/cms/categories')
      .set('Authorization', `Bearer ${sessionA}`)
      .set('X-Organization-Id', orgA._id.toString())
      .send({ name: 'Another Tech', slug: 'tech' });
    
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});
