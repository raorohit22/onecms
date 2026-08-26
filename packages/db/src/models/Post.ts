import { Schema, model, Document } from 'mongoose';
import { IAudit, Audit } from './Audit.js';

export type PostStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface IPostSEO {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  keywords?: string;
  noIndex?: boolean;
}

export interface IPost {
  organizationId: Schema.Types.ObjectId;
  workspaceId?: Schema.Types.ObjectId;
  authorId: Schema.Types.ObjectId;
  
  categoryIds: Schema.Types.ObjectId[];
  tagIds: Schema.Types.ObjectId[];
  featuredImage?: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  featuredMediaId?: Schema.Types.ObjectId;
  youtubeUrl?: string;

  title: string;
  slug: string;
  excerpt: string;
  content: any;
  legacyContent?: string;
  contentVersion?: number;
  
  status: PostStatus;
  
  seo?: IPostSEO;

  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostDocument extends IPost, Document {}

const seoSchema = new Schema<IPostSEO>({
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  canonicalUrl: { type: String, default: '' },
  ogImage: { type: String, default: '' },
  keywords: { type: String, default: '' },
  noIndex: { type: Boolean, default: false },
}, { _id: false });

const postSchema = new Schema<IPostDocument>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  tagIds: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  featuredImage: { type: String, default: '' },
  featuredImageAlt: { type: String, default: '' },
  featuredImageCaption: { type: String, default: '' },
  featuredMediaId: { type: Schema.Types.ObjectId },
  youtubeUrl: { type: String, default: '' },
  
  title: { type: String, required: true },
  slug: { type: String, required: true },
  excerpt: { type: String, default: '' },
  content: { type: String, required: true },
  legacyContent: { type: String, default: '' },
  contentVersion: { type: Number, default: 2 },
  
  status: {
    type: String,
    enum: ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  
  seo: { type: seoSchema },

  publishedAt: { type: Date, default: null }
}, {
  timestamps: true,
  collection: 'posts',
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

// Helper to create audit logs
async function createAuditLog(doc: IPostDocument, eventType: string, options: any) {
  try {
    const auditContext = options?.auditContext || doc.$locals?.auditContext;

    const snapshot = {
      title: doc.title,
      content: doc.content,
      excerpt: doc.excerpt,
      status: doc.status,
      categoryIds: doc.categoryIds,
      tagIds: doc.tagIds,
      featuredImage: doc.featuredImage,
      featuredImageAlt: doc.featuredImageAlt,
      featuredImageCaption: doc.featuredImageCaption,
      youtubeUrl: doc.youtubeUrl,
      seo: doc.seo
    };

    await Audit.create({
      organizationId: doc.organizationId,
      workspaceId: doc.workspaceId,
      eventType,
      userId: auditContext?.userId || doc.authorId,
      targetId: doc._id,
      ipAddress: auditContext?.ipAddress || 'unknown',
      userAgent: auditContext?.userAgent || 'unknown',
      metadata: { snapshot }
    });
  } catch (err) {
    // Suppress audit logging error in background
  }
}

postSchema.post('save', function(doc, next) {
  const eventType = this.isNew ? 'POST_CREATED' : 'POST_UPDATED';
  createAuditLog(doc, eventType, {}).catch(() => {});
  next();
});

postSchema.post('findOneAndUpdate', function(doc, next) {
  if (doc) {
    const options = this.getOptions();
    createAuditLog(doc, 'POST_UPDATED', options).catch(() => {});
  }
  next();
});

postSchema.post('findOneAndDelete', function(doc, next) {
  if (doc) {
    const options = this.getOptions();
    createAuditLog(doc, 'POST_DELETED', options).catch(() => {});
  }
  next();
});

// A post slug must be unique within an organization
postSchema.index({ organizationId: 1, slug: 1 }, { unique: true });

// Optimize querying for published posts by organization
postSchema.index({ organizationId: 1, status: 1, publishedAt: -1 });

export const Post = model<IPostDocument>('Post', postSchema);
