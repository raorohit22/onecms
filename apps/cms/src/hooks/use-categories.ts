import { useCrudResource } from './use-crud-resource';
import type { TableQueryState } from './use-table-query';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface CategoryFormInput {
  name: string;
  slug: string;
  description?: string;
}

/**
 * useCategories Hook
 * 
 * Provides TanStack Query CRUD state management for Categories.
 * Backed by the generic useCrudResource factory.
 */
export function useCategories(tableQuery?: TableQueryState) {
  return useCrudResource<CategoryItem, CategoryFormInput, CategoryFormInput>(
    {
      resourceKey: 'categories',
      endpoints: {
        list: '/categories',
        single: '/category',
        bulkDelete: '/categories/bulk-delete',
        export: '/categories/export',
        import: '/categories/import',
      },
    },
    tableQuery
  );
}
