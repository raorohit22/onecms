import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose from 'mongoose';
import { requireAuth } from '@api/modules/auth/auth.middleware';
import { requireOrganizationContext } from '@api/modules/tenant/tenant.middleware';
import { tenantRepository } from '@api/modules/tenant/tenant.repository';
import { Organization, Membership, User, Workspace } from '@onecms/db';
import { sessionService } from '@api/modules/auth/session.service';
import cookieParser from 'cookie-parser';
import { connectRedis, disconnectRedis } from '@api/infrastructure/redis/connection';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Dummy endpoints for testing
app.get('/api/protected', requireAuth, requireOrganizationContext, (req, res) => {
  res.json({ tenant: req.tenant });
});

app.get('/api/workspace/:id', requireAuth, requireOrganizationContext, async (req, res) => {
  const workspace = await tenantRepository.findById(Workspace, req.params.id, req.tenant!);
  if (!workspace) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(workspace);
});

describe('Tenant Isolation & Context', () => {
  let mongoServer: MongoMemoryServer;
  let redisServer: RedisMemoryServer;
  let userA: any, userB: any;
  let orgA: any, orgB: any;
  let workspaceA: any, workspaceB: any;
  let sessionA: string, sessionB: string;

  beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Start Redis Memory Server
    redisServer = await RedisMemoryServer.create();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();
    await connectRedis(`redis://${host}:${port}`);

    // Seed Data
    userA = await User.create({ email: 'a@example.com', passwordHash: 'hash', status: 'ACTIVE' });
    userB = await User.create({ email: 'b@example.com', passwordHash: 'hash', status: 'ACTIVE' });

    orgA = await Organization.create({ name: 'Org A', slug: 'org-a', status: 'ACTIVE' });
    orgB = await Organization.create({ name: 'Org B', slug: 'org-b', status: 'ACTIVE' });

    await Membership.create({ userId: userA._id, organizationId: orgA._id, roleIds: [], status: 'ACTIVE' });
    await Membership.create({ userId: userB._id, organizationId: orgB._id, roleIds: [], status: 'ACTIVE' });

    workspaceA = await Workspace.create({ organizationId: orgA._id, name: 'Workspace A', slug: 'wa' });
    workspaceB = await Workspace.create({ organizationId: orgB._id, name: 'Workspace B', slug: 'wb' });

    // Create Sessions
    sessionA = await sessionService.createSession(userA._id.toString(), {});
    sessionB = await sessionService.createSession(userB._id.toString(), {});
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
    await disconnectRedis();
    if (redisServer) await redisServer.stop();
  });

  it('should deny unauthenticated request', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('X-Organization-Id', orgA._id.toString());
    expect(res.status).toBe(401);
  });

  it('should deny authenticated request without X-Organization-Id', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${sessionA}`);
    expect(res.status).toBe(403);
  });

  it('should pass for User A + Org A', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${sessionA}`)
      .set('X-Organization-Id', orgA._id.toString());
    expect(res.status).toBe(200);
    expect(res.body.tenant.organizationId).toBe(orgA._id.toString());
  });

  it('should deny User A + Org B (not a member)', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${sessionA}`)
      .set('X-Organization-Id', orgB._id.toString());
    expect(res.status).toBe(403);
  });

  it('should pass for User B + Org B', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${sessionB}`)
      .set('X-Organization-Id', orgB._id.toString());
    expect(res.status).toBe(200);
    expect(res.body.tenant.organizationId).toBe(orgB._id.toString());
  });

  it('should isolate resources: User A can fetch Workspace A', async () => {
    const res = await request(app)
      .get(`/api/workspace/${workspaceA._id}`)
      .set('Authorization', `Bearer ${sessionA}`)
      .set('X-Organization-Id', orgA._id.toString());
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(workspaceA._id.toString());
  });

  it('should isolate resources: User A + Org A cannot fetch Workspace B (returns 404)', async () => {
    const res = await request(app)
      .get(`/api/workspace/${workspaceB._id}`)
      .set('Authorization', `Bearer ${sessionA}`)
      .set('X-Organization-Id', orgA._id.toString());
    expect(res.status).toBe(404);
  });
});
