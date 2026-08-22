import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuth } from './auth.middleware';
import { loginRateLimiter } from './rate-limit.middleware';

const router = Router();

// Login is strictly rate limited to protect against brute force / credential stuffing
router.post('/login', loginRateLimiter, authController.login);

// Refresh is NOT rate-limited by the same aggressive constraints since we have Lua-based rotation
router.post('/refresh', authController.refresh);

// Logout endpoints are protected
router.post('/logout', requireAuth, authController.logout);
router.post('/logout-all', requireAuth, authController.logoutAll);

// Identity retrieval
router.get('/me', requireAuth, authController.getMe);

// Session Management
router.get('/sessions', requireAuth, authController.getSessions);
router.delete('/sessions/:id', requireAuth, authController.revokeSession);

export const authRoutes: Router = router;
