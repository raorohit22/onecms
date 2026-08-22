import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '@api/app';
import { connectDB, disconnectDB } from '@onecms/db';
import { vi } from 'vitest';

// Mock Redis health so /health/ready evaluates to true for the database test
vi.mock('@api/infrastructure/redis/connection', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getRedisHealth: () => 'connected'
  };
});

describe('Database Integration', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    // Start an in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect using the test URI
    await connectDB(uri);
  });

  afterAll(async () => {
    // Disconnect and stop the server
    await disconnectDB();
    await mongoServer?.stop();
  });

  it('should establish a connection to MongoDB', () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  it('should return 200 OK for /health/ready when connected', async () => {
    const response = await request(app).get('/health/ready');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'onecms-api',
    });
  });
  
  it('should return 200 OK for /health/live even when connected', async () => {
    const response = await request(app).get('/health/live');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
