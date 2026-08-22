import { Post, IPostDocument, IPost } from '@onecms/db';
import { BaseCmsRepository, ListOptions } from './base-cms.repository';
import { ITenantContext } from '@api/core/context/tenant-context';

export type CreatePostInput = Omit<IPost, 'organizationId' | 'createdAt' | 'updatedAt'>;
export type UpdatePostInput = Partial<CreatePostInput>;

export class PostRepository extends BaseCmsRepository<IPostDocument, CreatePostInput, UpdatePostInput> {
  constructor() {
    super(Post, 'post');
  }

  /**
   * Overrides list to populate author details.
   */
  override async list(
    filter: Record<string, any> = {},
    context: ITenantContext,
    options: ListOptions = {}
  ): Promise<IPostDocument[]> {
    return super.list(filter, context, {
      populate: { path: 'authorId', select: 'firstName lastName username' } as any,
      ...options
    });
  }
}

export const postRepository = new PostRepository();
