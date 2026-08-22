import { redisClient } from '@api/infrastructure/redis/connection';
import { RedisKeyFactory } from '@api/infrastructure/redis/redis-key-factory';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '@api/config/env';

const JWT_SECRET = env.JWT_SECRET || 'fallback_development_secret_key_123!';

export interface ISessionData {
  sessionId: string;
  userId: string;
  familyId: string;
  roles: string[];
  permissions: string[];
  authVersion: number;
  status: 'ACTIVE' | 'REVOKED';
  ip: string;
  userAgent: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
}

export const sessionService = {
  generateAccessToken(userId: string, sessionId: string): string {
    return jwt.sign(
      { userId, sessionId },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  },

  verifyAccessToken(token: string): { userId: string; sessionId: string } {
    return jwt.verify(token, JWT_SECRET) as { userId: string; sessionId: string };
  },

  /**
   * Creates a new session in Redis and returns the sessionId.
   */
  async createSession(userId: string, data: Partial<ISessionData>, ttlSeconds: number = 604800): Promise<string> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const key = RedisKeyFactory.session(sessionId);
    
    const now = Date.now();
    const sessionData: ISessionData = {
      sessionId,
      userId,
      familyId: data.familyId || '',
      roles: data.roles || [],
      permissions: data.permissions || [],
      authVersion: data.authVersion || 1,
      status: 'ACTIVE',
      ip: data.ip || 'unknown',
      userAgent: data.userAgent || 'unknown',
      createdAt: now,
      lastSeenAt: now,
      expiresAt: now + (ttlSeconds * 1000)
    };

    if (!redisClient) throw new Error('Redis is unavailable');

    await redisClient.set(key, JSON.stringify(sessionData), 'EX', ttlSeconds);
    return sessionId;
  },

  /**
   * Retrieves a session from Redis. Returns null if not found.
   */
  async getSession(sessionId: string): Promise<ISessionData | null> {
    if (!redisClient) throw new Error('Redis is unavailable');
    
    const key = RedisKeyFactory.session(sessionId);
    const dataStr = await redisClient.get(key);
    
    if (!dataStr) return null;
    return JSON.parse(dataStr) as ISessionData;
  },

  /**
   * Revokes a session in Redis (fail-closed, explicitly marked as revoked).
   */
  async revokeSession(sessionId: string): Promise<void> {
    if (!redisClient) throw new Error('Redis is unavailable');
    
    const key = RedisKeyFactory.session(sessionId);
    const dataStr = await redisClient.get(key);
    if (!dataStr) return; // already gone
    
    const sessionData = JSON.parse(dataStr) as ISessionData;
    sessionData.status = 'REVOKED';
    
    await redisClient.set(key, JSON.stringify(sessionData), 'KEEPTTL');
  },
  
  /**
   * Touches a session to update lastSeenAt.
   */
  async updateLastSeen(sessionId: string): Promise<boolean> {
    if (!redisClient) throw new Error('Redis is unavailable');
    
    const key = RedisKeyFactory.session(sessionId);
    
    const dataStr = await redisClient.get(key);
    if (!dataStr) return false;
    
    const sessionData: ISessionData = JSON.parse(dataStr);
    sessionData.lastSeenAt = Date.now();
    
    await redisClient.set(key, JSON.stringify(sessionData), 'KEEPTTL');
    return true;
  }
};
