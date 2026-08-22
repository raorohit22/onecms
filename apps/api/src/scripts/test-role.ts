import { Role, connectDB, disconnectDB } from '@onecms/db';

async function test() {
  await connectDB('mongodb+srv://edurohityadav_db_user:u1vMEpMRi8MhZv5l@cluster0.oczhnax.mongodb.net/eshop');
  try {
    const role = new Role({
      organizationId: null, // Just to test schema
      scope: 'ORGANIZATION',
      name: 'Roles',
      description: 'Roles For employees',
      permissionIds: []
    });
    const error = role.validateSync();
    if (error) {
      console.log('Validation Error:', error.message);
    } else {
      console.log('Validation passed!');
    }
  } catch (err: any) {
    console.log('Error:', err.message);
  }
  await disconnectDB();
  process.exit(0);
}
test();
