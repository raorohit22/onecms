import { Schema, model, Document } from 'mongoose';

export interface IMedia {
  organizationId: Schema.Types.ObjectId;
  uploaderId: Schema.Types.ObjectId;
  
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string; // The public URL (e.g. S3 object URL or CDN URL)
  key: string; // The S3 object key
  
  altText?: string;
  caption?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IMediaDocument extends IMedia, Document {}

const mediaSchema = new Schema<IMediaDocument>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  key: { type: String, required: true },
  
  altText: { type: String, default: '' },
  caption: { type: String, default: '' },
}, {
  timestamps: true,
  collection: 'media',
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

mediaSchema.index({ organizationId: 1, createdAt: -1 });

export const Media = model<IMediaDocument>('Media', mediaSchema);
