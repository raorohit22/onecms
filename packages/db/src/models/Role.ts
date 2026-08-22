import { Schema, model, Document } from 'mongoose';

export interface IRole {
  organizationId: Schema.Types.ObjectId | null;
  scope: 'GLOBAL' | 'ORGANIZATION';
  name: string;
  description: string;
  isSystem: boolean; // Cannot be deleted
  permissionIds: Schema.Types.ObjectId[];
  parentRoleId: Schema.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoleDocument extends IRole, Document {}

const roleSchema = new Schema<IRoleDocument>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
  scope: { type: String, enum: ['GLOBAL', 'ORGANIZATION'], default: 'ORGANIZATION' },
  name: { type: String, required: true },
  description: { type: String, required: true },
  isSystem: { type: Boolean, default: false },
  permissionIds: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  parentRoleId: { type: Schema.Types.ObjectId, ref: 'Role', default: null, index: true },
}, {
  timestamps: true,
  collection: 'roles',
  strict: true,
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});
// Roles must have unique names within their organization scope
// Global roles (organizationId = null) will also have unique names globally
roleSchema.index({ organizationId: 1, name: 1 }, { unique: true });

// Avoid OverwriteModelError in serverless environments (Next.js)
export const Role = model<IRoleDocument>('Role', roleSchema);
