import mongoose from 'mongoose';
import { env } from '@api/config/env';

export const connectDatabase = async (uri?: string): Promise<void> => {
  const connectionString = uri || env.MONGODB_URI || env.MONGO_URI;
  if (!connectionString) return;

  await mongoose.connect(connectionString);
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
