import { Schema, model, Document } from 'mongoose';

export interface ICategory {
  organizationId: Schema.Types.ObjectId;
  workspaceId?: Schema.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryDocument extends ICategory, Document {}

const categorySchema = new Schema<ICategoryDocument>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  collection: 'categories',
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

// A category slug must be unique within an organization
categorySchema.index({ organizationId: 1, slug: 1 }, { unique: true });

// Avoid OverwriteModelError in serverless environments
export const Category = model<ICategoryDocument>('Category', categorySchema);
