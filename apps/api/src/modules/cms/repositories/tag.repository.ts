import { Tag, ITagDocument, ITag } from '@onecms/db';
import { BaseCmsRepository, ListOptions } from './base-cms.repository';
import { ITenantContext } from '@api/core/context/tenant-context';

export type CreateTagInput = Omit<ITag, 'organizationId' | 'createdAt' | 'updatedAt'>;
export type UpdateTagInput = Partial<CreateTagInput>;

export class TagRepository extends BaseCmsRepository<ITagDocument, CreateTagInput, UpdateTagInput> {
  constructor() {
    super(Tag, 'tag');
  }

  /**
   * Overrides list to provide default population of creator information.
   */
  override async list(
    filter: Record<string, any> = {},
    context: ITenantContext,
    options: ListOptions = {}
  ): Promise<ITagDocument[]> {
    return super.list(filter, context, {
      populate: 'createdBy',
      ...options
    });
  }
}

export const tagRepository = new TagRepository();
