import { useCrudResource } from './use-crud-resource';
import type { TableQueryState } from './use-table-query';

export interface TagItem {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface TagFormInput {
  name: string;
  slug: string;
}

/**
 * useTags Hook
 * 
 * Provides TanStack Query CRUD state management for Tags.
 * Backed by the generic useCrudResource factory.
 */
export function useTags(tableQuery?: TableQueryState) {
  return useCrudResource<TagItem, TagFormInput, TagFormInput>(
    {
      resourceKey: 'tags',
      endpoints: {
        list: '/tags',
        single: '/tag',
        bulkDelete: '/tags/bulk-delete',
        export: '/tags/export',
        import: '/tags/import',
      },
    },
    tableQuery
  );
}
