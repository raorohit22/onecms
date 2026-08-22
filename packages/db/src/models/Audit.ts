import { Schema, model, Document } from 'mongoose';

export type AuditEventType = 
  | 'LOGIN_SUCCESS' 
  | 'LOGIN_FAILED' 
  | 'LOGOUT' 
  | 'PASSWORD_CHANGED' 
  | 'ROLE_GRANTED' 
  | 'ROLE_REVOKED'
  | 'ACCOUNT_LOCKED'
  | 'TOKEN_REPLAY_DETECTED'
  | 'POST_CREATED'
  | 'POST_UPDATED'
  | 'POST_DELETED';

export interface IAudit {
  organizationId?: Schema.Types.ObjectId;
  workspaceId?: Schema.Types.ObjectId;
  eventType: AuditEventType;
  userId?: Schema.Types.ObjectId;
  targetId?: Schema.Types.ObjectId; // E.g., user who got the role
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface IAuditDocument extends IAudit, Document {}

const auditSchema = new Schema<IAuditDocument>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
  eventType: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  targetId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, expires: '365d', default: Date.now } // Auto-delete after 1 year for GDPR
}, {
  // We disable updatedAt since security events are immutable
  timestamps: { createdAt: false, updatedAt: false },
  collection: 'audits',
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export const Audit = model<IAuditDocument>('Audit', auditSchema);
