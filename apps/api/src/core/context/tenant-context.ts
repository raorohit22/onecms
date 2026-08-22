import { Types } from 'mongoose';

export interface IUserContext {
  userId: string;
  sessionId: string;
}

export interface ITenantContext {
  organizationId: string;
  membershipId: string;
  roleIds: string[];
  workspaceId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUserContext;
      tenant?: ITenantContext;
      id?: string;
    }
  }
}
