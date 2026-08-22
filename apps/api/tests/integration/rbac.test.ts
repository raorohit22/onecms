import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Organization, User, Membership, Role, Permission } from '@onecms/db';
import { requireOrganizationContext } from '@api/modules/tenant/tenant.middleware';
import { requirePermission } from '@api/modules/auth/rbac.middleware';
import { rbacService } from '@api/modules/auth/rbac.service';
import { ITenantContext } from '@api/core/context/tenant-context';

describe('RBAC Engine & Middleware (Phase 1D-B Hierarchy)', () => {
  let mongoServer: MongoMemoryServer;
  const app = express();

  let orgA: any;
  let orgB: any;
  let userA: any;
  let membershipA: any;
  
  let roleAdminOrgA: any;
  let roleGlobal: any;
  let roleAdminOrgB: any;
  
  let permReadWorkspace: any;
  let permCreatePost: any;
  let permReadPost: any;
  let permManageWorkspace: any;
  let permManageMembers: any;

  // Hierarchy Roles
  let roleEmployee: any;
  let roleManager: any;
  let roleAdmin: any;
  let roleGlobalBase: any;
  let roleGlobalAdmin: any;
  let roleInvalidInheritance: any;
  let roleCycleA: any;
  let roleCycleB: any;
  let roleCycleSelf: any;

  beforeAll(async () => {
    // 1. Setup DB
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // 2. Seed Data
    orgA = await Organization.create({ name: 'Org A', slug: 'org-a', status: 'ACTIVE' });
    orgB = await Organization.create({ name: 'Org B', slug: 'org-b', status: 'ACTIVE' });

    userA = await User.create({
      email: 'userA@example.com',
      passwordHash: 'hash',
      firstName: 'User',
      lastName: 'A',
      status: 'ACTIVE'
    });

    permReadWorkspace = await Permission.create({ action: 'READ', resource: 'WORKSPACE', description: 'Read workspaces' });
    permCreatePost = await Permission.create({ action: 'CREATE', resource: 'POST', description: 'Create posts' });
    permReadPost = await Permission.create({ action: 'READ', resource: 'POST', description: 'Read posts' });
    permManageWorkspace = await Permission.create({ action: 'MANAGE', resource: 'WORKSPACE', description: 'Manage workspaces' });
    permManageMembers = await Permission.create({ action: 'MANAGE', resource: 'MEMBERS', description: 'Manage members' });

    // Base Roles
    roleAdminOrgA = await Role.create({
      organizationId: orgA._id,
      scope: 'ORGANIZATION',
      name: 'Admin A',
      description: 'Admin for Org A',
      permissionIds: [permReadWorkspace._id, permCreatePost._id]
    });

    roleGlobal = await Role.create({
      organizationId: null,
      scope: 'GLOBAL',
      name: 'SuperAdmin',
      description: 'Global Admin',
      permissionIds: [permReadWorkspace._id]
    });

    roleAdminOrgB = await Role.create({
      organizationId: orgB._id,
      scope: 'ORGANIZATION',
      name: 'Admin B',
      description: 'Admin for Org B',
      permissionIds: [permCreatePost._id]
    });

    // Hierarchy Roles - Organization
    roleEmployee = await Role.create({
      organizationId: orgA._id,
      scope: 'ORGANIZATION',
      name: 'Employee',
      description: 'Employee',
      permissionIds: [permReadPost._id]
    });

    roleManager = await Role.create({
      organizationId: orgA._id,
      scope: 'ORGANIZATION',
      name: 'Manager',
      description: 'Manager',
      permissionIds: [permCreatePost._id],
      parentRoleId: roleEmployee._id
    });

    roleAdmin = await Role.create({
      organizationId: orgA._id,
      scope: 'ORGANIZATION',
      name: 'Admin',
      description: 'Admin',
      permissionIds: [permManageWorkspace._id],
      parentRoleId: roleManager._id
    });

    // Hierarchy Roles - Global
    roleGlobalBase = await Role.create({
      organizationId: null,
      scope: 'GLOBAL',
      name: 'GlobalBase',
      description: 'Global Base',
      permissionIds: [permReadWorkspace._id]
    });

    roleGlobalAdmin = await Role.create({
      organizationId: null,
      scope: 'GLOBAL',
      name: 'GlobalAdmin',
      description: 'Global Admin',
      permissionIds: [permManageMembers._id],
      parentRoleId: roleGlobalBase._id
    });

    // Invalid Scope Inheritance (GLOBAL -> ORGANIZATION)
    roleInvalidInheritance = await Role.create({
      organizationId: null,
      scope: 'GLOBAL',
      name: 'InvalidInheritance',
      description: 'Invalid Global -> Org',
      permissionIds: [],
      parentRoleId: roleEmployee._id // Global inheriting Org (Should be discarded)
    });

    // Cycles
    roleCycleSelf = await Role.create({
      organizationId: orgA._id,
      scope: 'ORGANIZATION',
      name: 'SelfCycle',
      description: 'Self Cycle',
      permissionIds: [permReadPost._id]
    });
    roleCycleSelf.parentRoleId = roleCycleSelf._id;
    await roleCycleSelf.save();

    roleCycleA = await Role.create({
      organizationId: orgA._id,
      scope: 'ORGANIZATION',
      name: 'CycleA',
      description: 'Cycle A',
      permissionIds: [permCreatePost._id]
    });
    roleCycleB = await Role.create({
      organizationId: orgA._id,
      scope: 'ORGANIZATION',
      name: 'CycleB',
      description: 'Cycle B',
      permissionIds: [permReadPost._id],
      parentRoleId: roleCycleA._id
    });
    roleCycleA.parentRoleId = roleCycleB._id;
    await roleCycleA.save();

    // User A belongs to Org A
    membershipA = await Membership.create({
      userId: userA._id,
      organizationId: orgA._id,
      status: 'ACTIVE',
      roleIds: [roleAdminOrgA._id, roleGlobal._id, roleAdminOrgB._id]
    });

    // 3. Setup Express App Mock
    app.use(express.json());

    app.use((req, res, next) => {
      req.user = { userId: userA._id.toString(), sessionId: 'mock-session' };
      next();
    });

    app.use(requireOrganizationContext);

    app.get('/api/workspaces', requirePermission('READ', 'WORKSPACE'), (req, res) => {
      res.status(200).json({ message: 'Success' });
    });

    app.get('/api/posts-strict', (req: Request, res: Response, next) => {
      if (req.tenant) {
        req.tenant.roleIds = [roleAdminOrgB._id.toString()];
      }
      next();
    }, requirePermission('CREATE', 'POST'), (req, res) => {
      res.status(200).json({ message: 'Success' });
    });

    app.get('/api/billing', requirePermission('MANAGE', 'BILLING'), (req, res) => {
      res.status(200).json({ message: 'Success' });
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('RBAC Service (Flat Resolution)', () => {
    it('resolves correct canonical permissions for a valid tenant context', async () => {
      const resolved = await rbacService.resolvePermissionsForRoles(
        [roleAdminOrgA._id.toString(), roleGlobal._id.toString()],
        orgA._id.toString()
      );
      
      expect(resolved.has('READ:WORKSPACE')).toBe(true);
      expect(resolved.has('CREATE:POST')).toBe(true);
    });

    it('discards injected roles that belong to another organization', async () => {
      const resolved = await rbacService.resolvePermissionsForRoles(
        [roleAdminOrgB._id.toString()],
        orgA._id.toString()
      );
      
      expect(resolved.has('CREATE:POST')).toBe(false);
      expect(resolved.size).toBe(0);
    });
  });

  describe('RBAC Service (Hierarchy Resolution)', () => {
    it('resolves child role (direct + parent permissions)', async () => {
      const resolved = await rbacService.resolvePermissionsForRoles([roleManager._id.toString()], orgA._id.toString());
      expect(resolved.has('CREATE:POST')).toBe(true); // Direct
      expect(resolved.has('READ:POST')).toBe(true);   // Parent
    });

    it('resolves three-level hierarchy', async () => {
      const resolved = await rbacService.resolvePermissionsForRoles([roleAdmin._id.toString()], orgA._id.toString());
      expect(resolved.has('MANAGE:WORKSPACE')).toBe(true); // Direct
      expect(resolved.has('CREATE:POST')).toBe(true);      // Parent (Manager)
      expect(resolved.has('READ:POST')).toBe(true);        // Grandparent (Employee)
    });

    it('resolves global hierarchy securely', async () => {
      const resolved = await rbacService.resolvePermissionsForRoles([roleGlobalAdmin._id.toString()], orgA._id.toString());
      expect(resolved.has('MANAGE:MEMBERS')).toBe(true);   // Direct
      expect(resolved.has('READ:WORKSPACE')).toBe(true);   // Parent
    });

    it('silently discards GLOBAL inheriting ORGANIZATION permissions (Scope Boundary Enforcement)', async () => {
      // roleInvalidInheritance is a GLOBAL role that has an ORGANIZATION role as parent.
      // Our engine must discard the ORG role during the loop.
      const resolved = await rbacService.resolvePermissionsForRoles([roleInvalidInheritance._id.toString()], orgA._id.toString());
      // The invalid parent has 'READ:POST', but we should NOT get it because a GLOBAL role requested it.
      expect(resolved.has('READ:POST')).toBe(false);
    });

    it('handles self-cycle safely', async () => {
      const resolved = await rbacService.resolvePermissionsForRoles([roleCycleSelf._id.toString()], orgA._id.toString());
      expect(resolved.has('READ:POST')).toBe(true);
      // If it didn't handle the cycle, it would hang infinitely or max out call stack
    });

    it('handles two-role cycle safely', async () => {
      const resolved = await rbacService.resolvePermissionsForRoles([roleCycleA._id.toString()], orgA._id.toString());
      expect(resolved.has('CREATE:POST')).toBe(true);
      expect(resolved.has('READ:POST')).toBe(true);
      // Safe exit
    });

    it('handles deleted parent role safely', async () => {
      // Delete Employee role
      await Role.deleteOne({ _id: roleEmployee._id });
      
      const resolved = await rbacService.resolvePermissionsForRoles([roleManager._id.toString()], orgA._id.toString());
      expect(resolved.has('CREATE:POST')).toBe(true); // Direct still works
      expect(resolved.has('READ:POST')).toBe(false);  // Parent is gone
    });
  });

  describe('RBAC Middleware Enforcement', () => {
    it('returns 200 when user has the required permission', async () => {
      const response = await request(app)
        .get('/api/workspaces')
        .set('X-Organization-Id', orgA._id.toString());
      
      expect(response.status).toBe(200);
    });

    it('returns 403 when user is missing the required permission', async () => {
      const response = await request(app)
        .get('/api/billing')
        .set('X-Organization-Id', orgA._id.toString());
      
      expect(response.status).toBe(403);
    });
  });
});
