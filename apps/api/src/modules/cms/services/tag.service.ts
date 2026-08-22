import { ITagDocument } from '@onecms/db';
import { ITenantContext } from '@api/core/context/tenant-context';
import { tagRepository, CreateTagInput, UpdateTagInput } from '../repositories/tag.repository';
import { BaseCmsService } from './base-cms.service';
import { ValidationError } from '@api/core/errors/AppError';

export class TagService extends BaseCmsService<ITagDocument, CreateTagInput, UpdateTagInput> {
  constructor() {
    super(tagRepository, 'Tag');
  }

  /**
   * Aliases for backwards compatibility with existing controllers
   */
  getTagById = this.getById.bind(this);
  getTagBySlug = this.getBySlug.bind(this);
  createTag = this.create.bind(this);
  updateTag = this.update.bind(this);
  deleteTag = this.delete.bind(this);
  deleteManyTags = this.deleteMany.bind(this);

  async listTags(
    context: ITenantContext,
    options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> } = {}
  ): Promise<{ data: ITagDocument[]; total: number }> {
    return this.list({}, context, options);
  }

  async exportTags(context: ITenantContext): Promise<Array<{ name: string; slug: string }>> {
    const tags = await tagRepository.list({}, context);
    return tags.map(t => ({
      name: t.name,
      slug: t.slug,
    }));
  }

  async importTags(
    data: Array<{ name: string; slug: string }>,
    context: ITenantContext
  ): Promise<{ successCount: number; errors: Array<{ row: number; data: unknown; error: string }> }> {
    let successCount = 0;
    const errors: Array<{ row: number; data: unknown; error: string }> = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      try {
        if (!row.name || !row.slug) {
          throw new ValidationError('Name and slug are required');
        }

        const existing = await tagRepository.findBySlug(row.slug, context);
        if (existing) {
          await tagRepository.update(existing._id.toString(), { name: row.name }, context);
        } else {
          await tagRepository.create({ name: row.name, slug: row.slug }, context);
        }
        successCount++;
      } catch (err: any) {
        errors.push({ row: i + 1, data: row, error: err?.message || 'Import error' });
      }
    }

    return { successCount, errors };
  }
}

export const tagService = new TagService();
