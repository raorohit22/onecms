import { Schema, model, Document } from 'mongoose';

export interface IWorkspace {
  organizationId: Schema.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspaceDocument extends IWorkspace, Document {}

const workspaceSchema = new Schema<IWorkspaceDocument>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, default: '' },
}, {
  timestamps: true,
  collection: 'workspaces',
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

// A workspace slug must be unique within an organization
workspaceSchema.index({ organizationId: 1, slug: 1 }, { unique: true });

export const Workspace = model<IWorkspaceDocument>('Workspace', workspaceSchema);
