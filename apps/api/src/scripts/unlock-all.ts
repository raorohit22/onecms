import { Role, MasterType, connectDB, disconnectDB } from '@onecms/db';

async function unlockAll() {
  await connectDB('mongodb+srv://edurohityadav_db_user:u1vMEpMRi8MhZv5l@cluster0.oczhnax.mongodb.net/eshop');
  
  const roleResult = await Role.updateMany({}, { $set: { isSystem: false } });
  console.log(`Unlocked ${roleResult.modifiedCount} roles.`);

  const masterTypeResult = await MasterType.updateMany({}, { $set: { isSystem: false } });
  console.log(`Unlocked ${masterTypeResult.modifiedCount} master types.`);

  await disconnectDB();
  process.exit(0);
}
unlockAll();
