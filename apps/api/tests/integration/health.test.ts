import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '@api/app';

describe('GET /health', () => {
  const app = createApp();

  it('should return 200 OK and health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'onecms-api',
    });
  });
});

describe('GET /health/live', () => {
  const app = createApp();

  it('should return 200 OK regardless of database state', async () => {
    const response = await request(app).get('/health/live');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('GET /health/ready (Disconnected)', () => {
  const app = createApp();

  it('should return 503 Unavailable when database is not connected', async () => {
    const response = await request(app).get('/health/ready');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: 'unavailable',
      service: 'onecms-api',
    });
  });
});
