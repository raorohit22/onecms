import { Schema, model, Document } from 'mongoose';

export interface ITag {
  organizationId: Schema.Types.ObjectId;
  workspaceId?: Schema.Types.ObjectId;
  name: string;
  slug: string;
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITagDocument extends ITag, Document {}

const tagSchema = new Schema<ITagDocument>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  collection: 'tags',
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

// A tag slug must be unique within an organization
tagSchema.index({ organizationId: 1, slug: 1 }, { unique: true });

export const Tag = model<ITagDocument>('Tag', tagSchema);
