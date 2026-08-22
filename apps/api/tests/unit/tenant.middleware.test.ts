import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireOrganizationContext } from '../../../src/modules/tenant/tenant.middleware';
import { Organization, Membership } from '@onecms/db';
import mongoose from 'mongoose';

vi.mock('@onecms/db', () => ({
  Organization: {
    findOne: vi.fn(),
  },
  Membership: {
    findOne: vi.fn(),
  },
}));

describe('tenant.middleware unit tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  const mockOrgId = new mongoose.Types.ObjectId().toString();
  const mockUserId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    req = {
      user: { userId: mockUserId, sessionId: 'session-123' },
      headers: {
        'x-organization-id': mockOrgId
      }
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    req.user = undefined;
    await requireOrganizationContext(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized', message: 'User not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if x-organization-id is missing', async () => {
    req.headers = {};
    await requireOrganizationContext(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden', message: 'Missing or invalid X-Organization-Id header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if organization does not exist or is inactive', async () => {
    vi.mocked(Organization.findOne).mockResolvedValueOnce(null);
    await requireOrganizationContext(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden', message: 'Organization not found or inactive' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if membership does not exist or is inactive', async () => {
    vi.mocked(Organization.findOne).mockResolvedValueOnce({ _id: mockOrgId });
    vi.mocked(Membership.findOne).mockResolvedValueOnce(null);
    await requireOrganizationContext(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden', message: 'Not a member of this organization' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and populate req.tenant when valid', async () => {
    vi.mocked(Organization.findOne).mockResolvedValueOnce({ _id: mockOrgId });
    const mockMembershipId = new mongoose.Types.ObjectId().toString();
    const mockRoleId = new mongoose.Types.ObjectId().toString();
    vi.mocked(Membership.findOne).mockResolvedValueOnce({ 
      _id: mockMembershipId,
      roleIds: [mockRoleId]
    });

    await requireOrganizationContext(req as Request, res as Response, next);
    
    expect(req.tenant).toBeDefined();
    expect(req.tenant?.organizationId).toBe(mockOrgId);
    expect(req.tenant?.membershipId).toBe(mockMembershipId);
    expect(req.tenant?.roleIds).toEqual([mockRoleId]);
    expect(next).toHaveBeenCalled();
  });
});
