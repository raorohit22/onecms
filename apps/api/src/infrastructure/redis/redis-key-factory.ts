/**
 * Centralized Redis Key Factory.
 * Do not scatter magic string key definitions across the application.
 */
export const RedisKeyFactory = {
  session: (sessionId: string) => `auth:session:${sessionId}`,
  refresh: (tokenHash: string) => `auth:refresh:${tokenHash}`,
  family: (familyId: string) => `auth:family:${familyId}`,
  authVersion: (userId: string) => `auth:version:${userId}`,
  
  rateLimitIp: (ip: string) => `rate:ip:${ip}`,
  rateLimitUser: (userId: string) => `rate:user:${userId}`,
  rateLimitIdentifier: (identifier: string) => `rate:identifier:${identifier}`,
  rateLimitEndpoint: (endpoint: string, ip: string) => `rate:endpoint:${endpoint}:${ip}`,
  
  authLock: (identifier: string) => `lock:auth:${identifier}`,
  securityCooldown: (key: string) => `security:cooldown:${key}`
};
