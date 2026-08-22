import { Request, Response } from 'express';
import { healthService } from './health.service';

/**
 * Basic service health (Liveness fallback)
 */
export function getHealth(req: Request, res: Response) {
  res.json({
    status: 'ok',
    service: 'onecms-api',
  });
}

/**
 * Process liveness check.
 * No dependency checks. Returns 200 OK if the Node process can accept requests.
 */
export function getHealthLive(req: Request, res: Response) {
  res.json({
    status: 'ok',
    service: 'onecms-api',
  });
}

/**
 * Dependency readiness check.
 * Verifies that required infrastructure (e.g., MongoDB) is available.
 * Returns 503 if any mandatory dependency is unavailable.
 */
export function getHealthReady(req: Request, res: Response) {
  const readiness = healthService.getReadiness();

  if (!readiness.isReady) {
    return res.status(503).json({
      status: 'unavailable',
      service: 'onecms-api',
      // We explicitly do NOT expose internal topology or connection errors here
    });
  }

  return res.json({
    status: 'ok',
    service: 'onecms-api',
  });
}
