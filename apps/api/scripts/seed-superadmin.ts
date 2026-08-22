import { connectDB, disconnectDB, User, Organization, Role, Membership } from '@onecms/db';
import * as argon2 from 'argon2';

async function seedSuperAdmin() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/onecms';
  console.log(`Connecting to database: ${uri}`);
  await connectDB(uri);

  try {
    const defaultOrg = await Organization.findOne({ slug: 'default-org' });
    if (!defaultOrg) {
      throw new Error('Default organization not found. Run migrate-to-tenants.ts first.');
    }

    const orgAdminRole = await Role.findOne({ organizationId: defaultOrg._id, name: 'OrgAdmin' });
    if (!orgAdminRole) {
      throw new Error('OrgAdmin role not found. Run seed-rbac.ts first.');
    }

    const email = 'admin@onecms.com';
    const password = 'password123';
    
    let user = await User.findOne({ email });

    if (user) {
      console.log(`Superadmin user ${email} already exists.`);
    } else {
      console.log(`Creating superadmin user ${email}...`);
      const passwordHash = await argon2.hash(password);
      user = await User.create({
        email,
        username: 'superadmin',
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        status: 'ACTIVE'
      });
      console.log(`User created with ID: ${user._id}`);
    }

    let membership = await Membership.findOne({ userId: user._id, organizationId: defaultOrg._id });
    if (!membership) {
      console.log('Creating membership for superadmin...');
      membership = await Membership.create({
        organizationId: defaultOrg._id,
        userId: user._id,
        roleIds: [orgAdminRole._id],
        status: 'ACTIVE'
      });
      console.log(`Membership created with ID: ${membership._id}`);
    } else {
      if (!membership.roleIds.includes(orgAdminRole._id as any)) {
        membership.roleIds.push(orgAdminRole._id as any);
        await membership.save();
        console.log('Added OrgAdmin role to existing membership.');
      } else {
        console.log('Membership already has OrgAdmin role.');
      }
    }

    console.log('\n--- Superadmin Account Ready ---');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await disconnectDB();
  }
}

seedSuperAdmin();
