import mongoose from 'mongoose';

/**
 * Connects to MongoDB using Mongoose.
 * 
 * In a monorepo, this database package is used by the API and potentially Next.js apps.
 * We must ensure we don't open multiple connections inadvertently, so we check readyState.
 */
export async function connectDB(uri: string): Promise<void> {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('[DB] Already connected to MongoDB');
      return;
    }

    if (mongoose.connection.readyState === 2) {
      console.log('[DB] Connection in progress...');
      return;
    }

    await mongoose.connect(uri);
    console.log('[DB] Successfully connected to MongoDB');
  } catch (error) {
    console.error('[DB] Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Disconnects from MongoDB gracefully.
 */
export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }
  
  try {
    await mongoose.disconnect();
    console.log('[DB] Successfully disconnected from MongoDB');
  } catch (error) {
    console.error('[DB] Failed to disconnect from MongoDB:', error);
    throw error;
  }
}
