import { IPost, IPostDocument, Membership, Category, Tag, Audit } from '@onecms/db';
import { ITenantContext } from '@api/core/context/tenant-context';
import { postRepository, CreatePostInput, UpdatePostInput } from '../repositories/post.repository';
import { BaseCmsService } from './base-cms.service';
import { tenantRepository } from '@api/modules/tenant/tenant.repository';
import { ValidationError, NotFoundError, ConflictError } from '@api/core/errors/AppError';

export class PostService extends BaseCmsService<IPostDocument, CreatePostInput, UpdatePostInput> {
  constructor() {
    super(postRepository, 'Post');
  }

  /**
   * Backwards compatible aliases
   */
  getPostById = this.getById.bind(this);
  getPostBySlug = this.getBySlug.bind(this);
  deletePost = this.delete.bind(this);
  deleteManyPosts = this.deleteMany.bind(this);
  countPosts = this.count.bind(this);

  private async validateMembership(userId: string, organizationId: string): Promise<void> {
    const membership = await Membership.findOne({ 
      userId, 
      organizationId,
      status: 'ACTIVE' 
    }).exec();
    
    if (!membership) {
      throw new ValidationError('Author is not an active member of this organization');
    }
  }

  private async validateCategories(categoryIds: string[], context: ITenantContext): Promise<void> {
    if (!categoryIds || categoryIds.length === 0) return;
    
    const count = await Category.countDocuments(
      tenantRepository.withTenant({ _id: { $in: categoryIds } }, context)
    ).exec();
    
    if (count !== categoryIds.length) {
      throw new ValidationError('One or more categories do not exist or belong to another organization');
    }
  }

  private async validateTags(tagIds: string[], context: ITenantContext): Promise<void> {
    if (!tagIds || tagIds.length === 0) return;
    
    const count = await Tag.countDocuments(
      tenantRepository.withTenant({ _id: { $in: tagIds } }, context)
    ).exec();
    
    if (count !== tagIds.length) {
      throw new ValidationError('One or more tags do not exist or belong to another organization');
    }
  }

  async listPosts(
    filter: Record<string, any> = {}, 
    context: ITenantContext,
    options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1>; cursor?: string } = {}
  ): Promise<IPostDocument[]> {
    return postRepository.list(filter, context, options);
  }

  async getPostRevisions(id: string, context: ITenantContext) {
    // Assert post exists in this tenant
    await this.getById(id, context);
    
    const audits = await Audit.find({ 
      targetId: id,
      organizationId: context.organizationId
    })
    .sort({ createdAt: -1 })
    .populate('userId', 'email firstName lastName')
    .exec();

    return audits.map(a => ({
      id: a.id,
      eventType: a.eventType,
      userId: a.userId,
      ipAddress: a.ipAddress,
      userAgent: a.userAgent,
      createdAt: a.createdAt,
      metadata: a.metadata
    }));
  }

  async createPost(data: CreatePostInput, context: ITenantContext): Promise<IPostDocument> {
    await this.validateMembership(data.authorId.toString(), context.organizationId);
    await this.validateCategories((data.categoryIds || []).map(id => id.toString()), context);
    await this.validateTags((data.tagIds || []).map(id => id.toString()), context);

    if (data.status === 'PUBLISHED' && !data.publishedAt) {
      data.publishedAt = new Date();
    }

    try {
      return await postRepository.create(data, context);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError('Post slug already exists in this organization');
      }
      throw error;
    }
  }

  async updatePost(id: string, data: UpdatePostInput, context: ITenantContext): Promise<IPostDocument> {
    const existingPost = await postRepository.findById(id, context);
    if (!existingPost) {
      throw new NotFoundError('Post');
    }

    if (data.authorId && data.authorId.toString() !== existingPost.authorId.toString()) {
      await this.validateMembership(data.authorId.toString(), context.organizationId);
    }

    if (data.categoryIds) {
      await this.validateCategories(data.categoryIds.map(cid => cid.toString()), context);
    }

    if (data.tagIds) {
      await this.validateTags(data.tagIds.map(tid => tid.toString()), context);
    }

    if (data.status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED' && !existingPost.publishedAt && !data.publishedAt) {
      data.publishedAt = new Date();
    }

    try {
      const updated = await postRepository.update(id, data, context);
      if (!updated) {
        throw new NotFoundError('Post');
      }
      return updated;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError('Post slug already exists in this organization');
      }
      throw error;
    }
  }

  async exportPosts(context: ITenantContext): Promise<Array<{ title: string; slug: string; status: string; excerpt: string }>> {
    const posts = await postRepository.list({}, context);
    return posts.map(p => ({
      title: p.title,
      slug: p.slug,
      status: p.status,
      excerpt: p.excerpt || '',
    }));
  }

  async importPosts(
    data: Array<{ title: string; slug: string; status?: string; excerpt?: string }>,
    context: ITenantContext
  ): Promise<{ successCount: number; errors: Array<{ row: number; data: unknown; error: string }> }> {
    let successCount = 0;
    const errors: Array<{ row: number; data: unknown; error: string }> = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      try {
        if (!row.title || !row.slug) {
          throw new ValidationError('Title and slug are required');
        }
        
        const existing = await postRepository.findBySlug(row.slug, context);
        if (existing) {
          await postRepository.update(existing._id.toString(), { title: row.title, status: row.status as any, excerpt: row.excerpt }, context);
        } else {
          throw new ValidationError('Cannot create new posts without an author via basic import yet');
        }
        successCount++;
      } catch (err: any) {
        errors.push({ row: i + 1, data: row, error: err?.message || 'Import error' });
      }
    }
    
    return { successCount, errors };
  }
}

export const postService = new PostService();
