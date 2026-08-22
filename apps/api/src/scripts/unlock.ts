import { MasterType, connectDB, disconnectDB } from '@onecms/db';

async function unlock() {
  await connectDB('mongodb+srv://edurohityadav_db_user:u1vMEpMRi8MhZv5l@cluster0.oczhnax.mongodb.net/eshop');
  await MasterType.updateOne({ slug: 'roles' }, { $set: { isSystem: false } });
  console.log('Unlocked Roles Master Type');
  await disconnectDB();
  process.exit(0);
}
unlock();
