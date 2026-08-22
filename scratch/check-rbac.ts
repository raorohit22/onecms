import mongoose from 'mongoose';
import { Membership, Organization, Role, Permission, User } from '@onecms/db';

async function diagnose() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/onecms';
  await mongoose.connect(uri);

  const userId = '6a806ee248a9aef3d19c1066';
  const orgId = '6a806ed8b25dddeb82429418';

  console.log('\n--- Checking User ---');
  const user = await User.findById(userId).lean();
  console.log('User:', user ? { id: user._id, email: user.email, roles: user.roles } : 'NOT FOUND');

  console.log('\n--- Checking Organization ---');
  const org = await Organization.findById(orgId).lean();
  console.log('Organization:', org ? { id: org._id, name: org.name, slug: org.slug, status: org.status } : 'NOT FOUND');

  console.log('\n--- Checking Membership ---');
  const membership = await Membership.findOne({ userId, organizationId: orgId }).lean();
  console.log('Membership:', membership ? {
    id: membership._id,
    userId: membership.userId,
    orgId: membership.organizationId,
    status: membership.status,
    roleIds: membership.roleIds
  } : 'NOT FOUND');

  if (membership && membership.roleIds) {
    console.log('\n--- Checking Membership Roles ---');
    const roles = await Role.find({ _id: { $in: membership.roleIds } }).lean();
    console.log('Found Roles count:', roles.length);
    for (const r of roles) {
      console.log('Role:', { id: r._id, name: r.name, scope: r.scope, organizationId: r.organizationId, permissionIdsCount: r.permissionIds?.length });
      if (r.permissionIds && r.permissionIds.length > 0) {
        const perms = await Permission.find({ _id: { $in: r.permissionIds } }).lean();
        console.log('Permissions for role', r.name, ':', perms.map(p => `${p.action}:${p.resource}`));
      }
    }
  }

  console.log('\n--- Checking All Roles for this Org or Global ---');
  const allRoles = await Role.find({ $or: [{ organizationId: orgId }, { scope: 'GLOBAL' }] }).lean();
  console.log('All Roles in DB count:', allRoles.length);
  for (const r of allRoles) {
    console.log('Role in DB:', { id: r._id, name: r.name, scope: r.scope, orgId: r.organizationId });
  }

  await mongoose.disconnect();
}

diagnose().catch(console.error);
