import mongoose from 'mongoose';
import { rbacService } from './src/modules/auth/rbac.service';
import { TenantContext } from './src/core/context/tenant-context';
import { connectDB } from './src/infrastructure/database/connection';

async function test() {
  await connectDB();
  
  // Create a mock tenant context based on a common scenario
  // To do this accurately, let's find the first organization and a user in it
  const Org = mongoose.connection.collection('organizations');
  const org = await Org.findOne({});
  if (!org) {
    console.log("No organization found");
    process.exit(0);
  }

  const Membership = mongoose.connection.collection('memberships');
  const member = await Membership.findOne({ organizationId: org._id });
  
  if (!member) {
    console.log("No member found for org", org._id);
    process.exit(0);
  }

  const tenant: TenantContext = {
    organizationId: org._id.toString(),
    userId: member.userId.toString(),
    roleIds: member.roleIds.map(id => id.toString()),
    isActive: true
  };

  console.log("Tenant context:", tenant);

  const hasPerm = await rbacService.hasPermission(tenant, 'READ', 'CATEGORY');
  console.log("Has READ:CATEGORY?", hasPerm);

  const hasPermPosts = await rbacService.hasPermission(tenant, 'READ', 'POST');
  console.log("Has READ:POST?", hasPermPosts);

  process.exit(0);
}

test().catch(console.error);
