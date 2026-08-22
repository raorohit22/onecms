import { connectDB, disconnectDB } from '../src/connection';
import { Organization } from '../src/models/Organization';
import { User } from '../src/models/User';
import { Membership } from '../src/models/Membership';
import { Role } from '../src/models/Role';
import { Audit } from '../src/models/Audit';

async function migrate() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/onecms';
  console.log(`Connecting to database: ${uri}`);
  await connectDB(uri);

  try {
    console.log('--- Starting Tenant Foundation Migration ---');

    // 1. Create Default Organization idempotently
    let defaultOrg = await Organization.findOne({ slug: 'default-org' });
    if (!defaultOrg) {
      console.log('Creating Default Organization...');
      defaultOrg = await Organization.create({
        name: 'Default Organization',
        slug: 'default-org',
        status: 'ACTIVE'
      });
      console.log(`Created Default Organization: ${defaultOrg._id}`);
    } else {
      console.log(`Default Organization already exists: ${defaultOrg._id}`);
    }

    // 2. Migrate Users to Memberships idempotently
    // Note: We use strict: false to access the old `roleIds` field which we removed from the schema
    const usersWithRoles = await User.find({ roleIds: { $exists: true, $not: { $size: 0 } } }, {}, { strict: false });
    console.log(`Found ${usersWithRoles.length} users with legacy roleIds.`);

    for (const user of usersWithRoles) {
      // Check if membership already exists for this org
      let membership = await Membership.findOne({ userId: user._id, organizationId: defaultOrg._id });
      
      if (!membership) {
        console.log(`Creating Membership for user ${user._id}`);
        // @ts-ignore - Accessing legacy field
        const legacyRoleIds = user.get('roleIds') || [];
        
        membership = await Membership.create({
          userId: user._id,
          organizationId: defaultOrg._id,
          roleIds: legacyRoleIds,
          status: 'ACTIVE'
        });
      } else {
        console.log(`Membership already exists for user ${user._id}`);
      }

      // Safe to unset roleIds since we've migrated them
      console.log(`Unsetting legacy roleIds on user ${user._id}`);
      await User.collection.updateOne(
        { _id: user._id },
        { $unset: { roleIds: "" } }
      );
    }

    // 3. Migrate Roles
    // Find all roles that don't have an organizationId yet
    const rolesToMigrate = await Role.find({ organizationId: null, scope: { $ne: 'GLOBAL' } });
    console.log(`Found ${rolesToMigrate.length} custom roles to migrate to Default Organization.`);

    for (const role of rolesToMigrate) {
      if (role.isSystem) {
        console.log(`Marking system role '${role.name}' as GLOBAL.`);
        role.scope = 'GLOBAL';
        role.organizationId = null;
      } else {
        console.log(`Scoping custom role '${role.name}' to Default Organization.`);
        role.scope = 'ORGANIZATION';
        role.organizationId = defaultOrg._id as any;
      }
      await role.save();
    }

    // 4. Migrate Audits (formerly SecurityEvents)
    // Audits might already have organizationId, so we check for missing ones.
    const auditsToMigrate = await Audit.find({ organizationId: { $exists: false } });
    console.log(`Found ${auditsToMigrate.length} legacy audits to migrate to Default Organization.`);
    
    for (const audit of auditsToMigrate) {
      audit.organizationId = defaultOrg._id as any;
      await audit.save();
    }

    console.log('--- Migration Completed Successfully ---');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

migrate();
