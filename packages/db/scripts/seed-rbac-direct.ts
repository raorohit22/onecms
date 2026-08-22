import { connectDB, disconnectDB } from '../src/connection';
import { Organization } from '../src/models/Organization';
import { Permission } from '../src/models/Permission';
import { Role } from '../src/models/Role';
import { Membership } from '../src/models/Membership';

// Hardcode URI to avoid any environment variable resolution issues across OS/runners
process.env.MONGO_URI = "mongodb+srv://edurohityadav_db_user:u1vMEpMRi8MhZv5l@cluster0.oczhnax.mongodb.net/eshop";

async function seed() {
  const uri = process.env.MONGO_URI;
  console.log(`Connecting to database: ${uri}`);
  await connectDB(uri);

  try {
    console.log('--- Starting RBAC Seeding (Phase 1D-A) ---');

    // 1. Ensure Default Organization exists (created in previous migration)
    const defaultOrg = await Organization.findOne({ slug: 'default-org' });
    if (!defaultOrg) {
      throw new Error('Default Organization not found. Please run migrate-to-tenants.ts first.');
    }

    // 2. Define Core System Permissions
    const systemPermissions = [
      { action: 'READ', resource: 'WORKSPACE', description: 'View workspaces in the organization' },
      { action: 'MANAGE', resource: 'WORKSPACE', description: 'Create, edit, or delete workspaces' },
      { action: 'READ', resource: 'MEMBERS', description: 'View organization members' },
      { action: 'MANAGE', resource: 'MEMBERS', description: 'Invite or remove members, change roles' },
      
      // Post Permissions
      { action: 'CREATE', resource: 'POST', description: 'Create new content posts' },
      { action: 'READ', resource: 'POST', description: 'View content posts' },
      { action: 'UPDATE', resource: 'POST', description: 'Update content posts' },
      { action: 'DELETE', resource: 'POST', description: 'Delete content posts' },
      
      // Category Permissions
      { action: 'CREATE', resource: 'CATEGORY', description: 'Create categories' },
      { action: 'READ', resource: 'CATEGORY', description: 'View categories' },
      { action: 'UPDATE', resource: 'CATEGORY', description: 'Update categories' },
      { action: 'DELETE', resource: 'CATEGORY', description: 'Delete categories' },
      
      // Tag Permissions
      { action: 'CREATE', resource: 'TAG', description: 'Create tags' },
      { action: 'READ', resource: 'TAG', description: 'View tags' },
      { action: 'UPDATE', resource: 'TAG', description: 'Update tags' },
      { action: 'DELETE', resource: 'TAG', description: 'Delete tags' },
      
      // Master Type Permissions
      { action: 'CREATE', resource: 'MASTER_TYPE', description: 'Create master types' },
      { action: 'READ', resource: 'MASTER_TYPE', description: 'View master types' },
      { action: 'UPDATE', resource: 'MASTER_TYPE', description: 'Update master types' },
      { action: 'DELETE', resource: 'MASTER_TYPE', description: 'Delete master types' },
      
      // Master Value Permissions
      { action: 'CREATE', resource: 'MASTER_VALUE', description: 'Create master values' },
      { action: 'READ', resource: 'MASTER_VALUE', description: 'View master values' },
      { action: 'UPDATE', resource: 'MASTER_VALUE', description: 'Update master values' },
      { action: 'DELETE', resource: 'MASTER_VALUE', description: 'Delete master values' },
      
      // Settings Permissions
      { action: 'MANAGE', resource: 'SETTINGS', description: 'Manage system settings and RBAC' }
    ];

    console.log('Seeding Permissions...');
    const createdPermissions: Record<string, any> = {};
    for (const p of systemPermissions) {
      const perm = await Permission.findOneAndUpdate(
        { action: p.action, resource: p.resource },
        { $set: { ...p, isSystem: true } },
        { upsert: true, new: true }
      );
      createdPermissions[`${p.action}:${p.resource}`] = perm;
    }
    console.log(`Seeded ${Object.keys(createdPermissions).length} permissions.`);

    console.log('Seeding Default Roles for Default Organization...');
    const adminPermIds = Object.values(createdPermissions).map(p => p._id);
    const memberPermIds = [
      createdPermissions['READ:WORKSPACE']._id,
      createdPermissions['READ:MEMBERS']._id,
      createdPermissions['READ:POST']._id,
      createdPermissions['CREATE:POST']._id,
      createdPermissions['UPDATE:POST']._id,
      createdPermissions['READ:CATEGORY']._id,
      createdPermissions['READ:TAG']._id
    ];

    // SuperAdmin (Global)
    const superAdminRole = await Role.findOneAndUpdate(
      { name: 'Super Admin' },
      { 
        $set: {
          organizationId: null,
          scope: 'GLOBAL',
          description: 'Global God-mode administrator',
          isSystem: true,
          permissionIds: adminPermIds
        } 
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded Super Admin Role (GLOBAL): ${superAdminRole._id}`);

    // Admin
    const adminRole = await Role.findOneAndUpdate(
      { organizationId: defaultOrg._id, name: 'Admin' },
      { 
        $set: {
          scope: 'ORGANIZATION',
          description: 'Full administrative access to the organization',
          isSystem: true, // System role for this org
          permissionIds: adminPermIds
        } 
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded Admin Role: ${adminRole._id}`);

    // Member
    const memberRole = await Role.findOneAndUpdate(
      { organizationId: defaultOrg._id, name: 'Member' },
      { 
        $set: {
          scope: 'ORGANIZATION',
          description: 'Standard member access',
          isSystem: true,
          permissionIds: memberPermIds
        } 
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded Member Role: ${memberRole._id}`);

    const memberships = await Membership.find({ organizationId: defaultOrg._id });
    if (memberships.length > 0) {
      const firstMembership = memberships[0];
      if (!firstMembership.roleIds || firstMembership.roleIds.length === 0) {
        firstMembership.roleIds = [superAdminRole._id as any];
        await firstMembership.save();
        console.log(`Attached Super Admin role to Membership ${firstMembership._id}`);
      }
    }

    console.log('--- RBAC Seeding Completed Successfully ---');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

seed();
