import { MasterType } from '@onecms/db';
import { connectDB, disconnectDB } from '@onecms/db';
import mongoose from 'mongoose';

const DEFAULT_MASTERS = [
  { name: 'Roles', slug: 'roles', description: 'System Roles for RBAC', isSystem: true, sortOrder: 10 },
  { name: 'Languages', slug: 'languages', description: 'Supported languages', isSystem: false, sortOrder: 20 },
  { name: 'Locations', slug: 'locations', description: 'Business locations', isSystem: false, sortOrder: 30 },
  { name: 'Country', slug: 'country', description: 'Countries list', isSystem: false, sortOrder: 40 },
  { name: 'State', slug: 'state', description: 'States list', isSystem: false, sortOrder: 50 },
  { name: 'City', slug: 'city', description: 'Cities list', isSystem: false, sortOrder: 60 },
  { name: 'District', slug: 'district', description: 'Districts', isSystem: false, sortOrder: 70 },
  { name: 'Pincode', slug: 'pincode', description: 'Postal codes', isSystem: false, sortOrder: 80 },
  { name: 'Currency', slug: 'currency', description: 'Currencies', isSystem: false, sortOrder: 90 },
];

async function seedMasters() {
  console.log('Connecting to database...');
  await connectDB(process.env.MONGO_URI as string);
  console.log('Connected.');

  for (const master of DEFAULT_MASTERS) {
    const existing = await MasterType.findOne({ slug: master.slug, organizationId: null });
    
    if (!existing) {
      console.log(`Creating Master Type: ${master.name}`);
      await MasterType.create({
        ...master,
        organizationId: null // Seeded globally for the system
      });
    } else {
      console.log(`Master Type already exists: ${master.name}`);
    }
  }

  console.log('Seed completed successfully.');
  await disconnectDB();
  process.exit(0);
}

seedMasters().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
