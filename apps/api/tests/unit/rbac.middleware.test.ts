import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requirePermission } from '../../../src/modules/auth/rbac.middleware';
import { rbacService } from '../../../src/modules/auth/rbac.service';
import mongoose from 'mongoose';

vi.mock('../../../src/modules/auth/rbac.service', () => ({
  rbacService: {
    hasPermission: vi.fn(),
  },
}));

describe('rbac.middleware unit tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      tenant: {
        organizationId: new mongoose.Types.ObjectId().toString(),
        membershipId: new mongoose.Types.ObjectId().toString(),
        roleIds: [new mongoose.Types.ObjectId().toString()]
      }
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('should return 500 if tenant context is missing', async () => {
    req.tenant = undefined;
    const middleware = requirePermission('create', 'post');
    await middleware(req as Request, res as Response, next);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Internal Server Error' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if rbacService returns false (unauthorized)', async () => {
    vi.mocked(rbacService.hasPermission).mockResolvedValueOnce(false);
    
    const middleware = requirePermission('create', 'post');
    await middleware(req as Request, res as Response, next);
    
    expect(rbacService.hasPermission).toHaveBeenCalledWith(req.tenant, 'create', 'post');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'Missing required permission: CREATE:POST'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if rbacService returns true (authorized)', async () => {
    vi.mocked(rbacService.hasPermission).mockResolvedValueOnce(true);
    
    const middleware = requirePermission('update', 'category');
    await middleware(req as Request, res as Response, next);
    
    expect(rbacService.hasPermission).toHaveBeenCalledWith(req.tenant, 'update', 'category');
    expect(next).toHaveBeenCalled();
  });
});
