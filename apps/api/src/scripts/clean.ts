import { Role, connectDB, disconnectDB } from '@onecms/db';

async function clean() {
  await connectDB('mongodb+srv://edurohityadav_db_user:u1vMEpMRi8MhZv5l@cluster0.oczhnax.mongodb.net/eshop');
  await Role.deleteOne({ name: 'Roles', description: 'Roles For employees' });
  console.log('Cleaned up test role');
  await disconnectDB();
  process.exit(0);
}
clean();
