import { ICategoryDocument } from '@onecms/db';
import { ITenantContext } from '@api/core/context/tenant-context';
import { categoryRepository, CreateCategoryInput, UpdateCategoryInput } from '../repositories/category.repository';
import { BaseCmsService } from './base-cms.service';
import { ValidationError } from '@api/core/errors/AppError';

export class CategoryService extends BaseCmsService<ICategoryDocument, CreateCategoryInput, UpdateCategoryInput> {
  constructor() {
    super(categoryRepository, 'Category');
  }

  /**
   * Aliases for backwards compatibility with existing controllers
   */
  getCategoryById = this.getById.bind(this);
  getCategoryBySlug = this.getBySlug.bind(this);
  createCategory = this.create.bind(this);
  updateCategory = this.update.bind(this);
  deleteCategory = this.delete.bind(this);
  deleteManyCategories = this.deleteMany.bind(this);

  async listCategories(
    context: ITenantContext,
    options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> } = {}
  ): Promise<{ data: ICategoryDocument[]; total: number }> {
    return this.list({}, context, options);
  }

  async exportCategories(context: ITenantContext): Promise<Array<{ name: string; slug: string; description?: string }>> {
    const categories = await categoryRepository.list({}, context);
    return categories.map(c => ({
      name: c.name,
      slug: c.slug,
      description: c.description || '',
    }));
  }

  async importCategories(
    data: Array<{ name: string; slug: string; description?: string }>,
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

        const existing = await categoryRepository.findBySlug(row.slug, context);
        if (existing) {
          await categoryRepository.update(existing._id.toString(), { name: row.name, description: row.description || '' }, context);
        } else {
          await categoryRepository.create({ name: row.name, slug: row.slug, description: row.description || '' }, context);
        }
        successCount++;
      } catch (err: any) {
        errors.push({ row: i + 1, data: row, error: err?.message || 'Import error' });
      }
    }

    return { successCount, errors };
  }
}

export const categoryService = new CategoryService();
