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

describe('Tag Routes Integration', () => {
  let mongoServer: MongoMemoryServer;
  let redisServer: RedisMemoryServer;
  let userA: any, userB: any, orgA: any, orgB: any, sessionA: string, sessionB: string;
  let tagAId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());

    redisServer = await RedisMemoryServer.create();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();
    await connectRedis(`redis://${host}:${port}`);

    userA = await User.create({ email: 'tag_a@example.com', passwordHash: 'hash', status: 'ACTIVE' });
    userB = await User.create({ email: 'tag_b@example.com', passwordHash: 'hash', status: 'ACTIVE' });
    orgA = await Organization.create({ name: 'Org A Tag', slug: 'org-a-tag', status: 'ACTIVE' });
    orgB = await Organization.create({ name: 'Org B Tag', slug: 'org-b-tag', status: 'ACTIVE' });

    const permCreate = await Permission.create({ action: 'CREATE', resource: 'TAG', isSystem: true });
    const permRead = await Permission.create({ action: 'READ', resource: 'TAG', isSystem: true });
    const permUpdate = await Permission.create({ action: 'UPDATE', resource: 'TAG', isSystem: true });
    const permDelete = await Permission.create({ action: 'DELETE', resource: 'TAG', isSystem: true });

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

  it('creates tag successfully', async () => {
    const res = await request(app)
      .post('/tag')
      .set('Authorization', `Bearer ${sessionA}`)
      .set('X-Organization-Id', orgA._id.toString())
      .send({ name: 'Node', slug: 'node' });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('node');
    tagAId = res.body._id;
  });

  it('rejects duplicate slugs (returns 409)', async () => {
    const res = await request(app)
      .post('/tag')
      .set('Authorization', `Bearer ${sessionA}`)
      .set('X-Organization-Id', orgA._id.toString())
      .send({ name: 'Another Node', slug: 'node' });
    
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects cross-tenant patch (returns 404)', async () => {
    const res = await request(app)
      .patch(`/tag/${tagAId}`)
      .set('Authorization', `Bearer ${sessionB}`)
      .set('X-Organization-Id', orgB._id.toString())
      .send({ name: 'Hacked' });
    
    expect(res.status).toBe(404);
  });
});
