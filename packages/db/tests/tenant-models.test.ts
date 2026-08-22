import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../src/connection';
import { Organization, Workspace, Membership, User, Role } from '../src/index';

describe('Database Tenant Foundation Models', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectDB(uri);
  }, 120000); // 2 minute timeout for downloading mongodb binary

  afterAll(async () => {
    // Clean up collections manually since the models are cached
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
    await disconnectDB();
    await mongoServer?.stop();
  });

  it('should prevent duplicate organization slugs', async () => {
    await Organization.create({ name: 'Org A', slug: 'org-a', status: 'ACTIVE' });
    
    await expect(
      Organization.create({ name: 'Another Org A', slug: 'org-a', status: 'ACTIVE' })
    ).rejects.toThrow(/E11000 duplicate key error/);
  });

  it('should allow duplicate workspace slugs across different organizations', async () => {
    const org1 = await Organization.create({ name: 'O1', slug: 'o1', status: 'ACTIVE' });
    const org2 = await Organization.create({ name: 'O2', slug: 'o2', status: 'ACTIVE' });

    await Workspace.create({ organizationId: org1._id, name: 'Eng', slug: 'eng' });
    const ws2 = await Workspace.create({ organizationId: org2._id, name: 'Engineering', slug: 'eng' });

    expect(ws2._id).toBeDefined();

    // But should reject duplicate slug in same org
    await expect(
      Workspace.create({ organizationId: org1._id, name: 'Eng 2', slug: 'eng' })
    ).rejects.toThrow(/E11000 duplicate key error/);
  });

  it('should prevent duplicate memberships for same user and organization', async () => {
    const org = await Organization.create({ name: 'O3', slug: 'o3', status: 'ACTIVE' });
    const user = await User.create({
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hash',
      firstName: 'Test',
      lastName: 'User'
    });

    await Membership.create({ userId: user._id, organizationId: org._id, roleIds: [] });

    await expect(
      Membership.create({ userId: user._id, organizationId: org._id, roleIds: [] })
    ).rejects.toThrow(/E11000 duplicate key error/);
  });

  it('should allow user to have memberships in different organizations', async () => {
    const org4 = await Organization.create({ name: 'O4', slug: 'o4', status: 'ACTIVE' });
    const org5 = await Organization.create({ name: 'O5', slug: 'o5', status: 'ACTIVE' });
    const user = await User.create({
      email: 'multi@example.com',
      username: 'multi',
      passwordHash: 'hash',
      firstName: 'Multi',
      lastName: 'User'
    });

    const m1 = await Membership.create({ userId: user._id, organizationId: org4._id, roleIds: [] });
    const m2 = await Membership.create({ userId: user._id, organizationId: org5._id, roleIds: [] });

    expect(m1._id).toBeDefined();
    expect(m2._id).toBeDefined();
  });

  it('should allow duplicate role names across different organizations', async () => {
    const orgA = await Organization.create({ name: 'Org A', slug: 'a', status: 'ACTIVE' });
    const orgB = await Organization.create({ name: 'Org B', slug: 'b', status: 'ACTIVE' });

    await Role.create({
      name: 'Admin',
      description: 'Admin',
      organizationId: orgA._id,
      scope: 'ORGANIZATION'
    });

    const role2 = await Role.create({
      name: 'Admin',
      description: 'Admin',
      organizationId: orgB._id,
      scope: 'ORGANIZATION'
    });

    expect(role2._id).toBeDefined();

    // But reject in same org
    await expect(
      Role.create({
        name: 'Admin',
        description: 'Admin',
        organizationId: orgA._id,
        scope: 'ORGANIZATION'
      })
    ).rejects.toThrow(/E11000 duplicate key error/);
  });

  it('should allow creating a global role and reject duplicates', async () => {
    const globalRole = await Role.create({
      name: 'SuperAdmin',
      description: 'System Admin',
      scope: 'GLOBAL',
      organizationId: null
    });

    expect(globalRole._id).toBeDefined();

    await expect(
      Role.create({
        name: 'SuperAdmin',
        description: 'System Admin duplicate',
        scope: 'GLOBAL',
        organizationId: null
      })
    ).rejects.toThrow(/E11000 duplicate key error/);
  });

  it('should ensure user creation succeeds without roleIds', async () => {
    const user = await User.create({
      email: 'norole@example.com',
      username: 'norole',
      passwordHash: 'hash',
      firstName: 'No',
      lastName: 'Role'
    });

    // @ts-ignore - Check that it's undefined
    expect(user.roleIds).toBeUndefined();
    expect(user._id).toBeDefined();
  });
});
