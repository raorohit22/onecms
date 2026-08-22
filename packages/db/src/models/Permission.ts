import { Schema, model, Document } from 'mongoose';

export interface IPermission {
  action: string;      // e.g. 'CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'
  resource: string;    // e.g. 'POST', 'USER', 'ROLE', 'ALL'
  description: string;
  isSystem: boolean;   // System permissions cannot be modified or deleted
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermissionDocument extends IPermission, Document {}

const permissionSchema = new Schema<IPermissionDocument>({
  action: { type: String, required: true },
  resource: { type: String, required: true },
  description: { type: String, required: true },
  isSystem: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'permissions',
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound index to ensure uniqueness of action + resource
permissionSchema.index({ action: 1, resource: 1 }, { unique: true });

export const Permission = model<IPermissionDocument>('Permission', permissionSchema);
