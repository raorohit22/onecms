import { Category, ICategoryDocument, ICategory } from '@onecms/db';
import { BaseCmsRepository, ListOptions } from './base-cms.repository';
import { ITenantContext } from '@api/core/context/tenant-context';

export type CreateCategoryInput = Omit<ICategory, 'organizationId' | 'createdAt' | 'updatedAt'>;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export class CategoryRepository extends BaseCmsRepository<ICategoryDocument, CreateCategoryInput, UpdateCategoryInput> {
  constructor() {
    super(Category, 'category');
  }

  /**
   * Overrides list to provide default population of creator information.
   */
  override async list(
    filter: Record<string, any> = {},
    context: ITenantContext,
    options: ListOptions = {}
  ): Promise<ICategoryDocument[]> {
    return super.list(filter, context, {
      populate: 'createdBy',
      ...options
    });
  }
}

export const categoryRepository = new CategoryRepository();
