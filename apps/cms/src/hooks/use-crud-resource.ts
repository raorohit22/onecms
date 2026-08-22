import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useOrganization } from '../auth/organization-context';
import type { TableQueryState } from './use-table-query';

export interface CrudResourceEndpoints {
  list: string;
  single: string;
  bulkDelete?: string;
  export?: string;
  import?: string;
}

export interface CrudResourceConfig<TItem, TCreateInput, TUpdateInput> {
  resourceKey: string;
  endpoints: CrudResourceEndpoints;
  additionalInvalidationKeys?: string[][];
  formatCreateParams?: (payload: TCreateInput) => any;
  formatUpdateParams?: (id: string, payload: TUpdateInput) => any;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface BulkDeletePayload {
  ids?: string[];
  selectAll?: boolean;
  excludedIds?: string[];
}

export interface ImportResult {
  successCount: number;
  errors?: Array<{ row: number; data: unknown; error: string }>;
}

/**
 * Generic CRUD Resource Hook Factory.
 * 
 * Centralizes TanStack Query boilerplate across oneCMS entities (Categories, Tags, Posts, etc.).
 * Guarantees consistent:
 * 1. Cache key generation & tenant scoping.
 * 2. URL parameter building (pagination, sorting).
 * 3. Cache invalidation on mutations (clears list & dashboard stats).
 * 4. Error propagation and standardized response signatures.
 */
export function useCrudResource<
  TItem extends { id?: string; _id?: string },
  TCreateInput = any,
  TUpdateInput = any
>(
  config: CrudResourceConfig<TItem, TCreateInput, TUpdateInput>,
  tableQuery?: TableQueryState
) {
  const { activeOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const { resourceKey, endpoints, additionalInvalidationKeys = [] } = config;

  const invalidateRelated = () => {
    queryClient.invalidateQueries({ queryKey: [resourceKey, activeOrganizationId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', activeOrganizationId] });
    additionalInvalidationKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [...key, activeOrganizationId] });
    });
  };

  // 1. List Query
  const query = useQuery<PaginatedApiResponse<TItem>>({
    queryKey: [resourceKey, activeOrganizationId, tableQuery?.page, tableQuery?.pageSize, tableQuery?.sort, tableQuery?.dir],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tableQuery) {
        params.append('page', tableQuery.page.toString());
        params.append('limit', tableQuery.pageSize.toString());
        params.append('sort', tableQuery.sort);
        params.append('dir', tableQuery.dir);
      }
      const separator = endpoints.list.includes('?') ? '&' : '?';
      const url = `${endpoints.list}${params.toString() ? `${separator}${params.toString()}` : ''}`;
      const { data } = await apiClient.get(url);
      return data || { data: [], meta: { total: 0, page: 1, totalPages: 0 } };
    },
    enabled: !!activeOrganizationId,
    placeholderData: keepPreviousData,
  });

  // 2. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${endpoints.single}/${id}`);
    },
    onSuccess: () => invalidateRelated(),
  });

  // 3. Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: TCreateInput) => {
      const body = config.formatCreateParams ? config.formatCreateParams(payload) : payload;
      const { data } = await apiClient.post(endpoints.single, body);
      return data as TItem;
    },
    onSuccess: () => invalidateRelated(),
  });

  // 4. Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: TUpdateInput }) => {
      const body = config.formatUpdateParams ? config.formatUpdateParams(id, payload) : payload;
      const { data } = await apiClient.patch(`${endpoints.single}/${id}`, body);
      return data as TItem;
    },
    onSuccess: (_, variables) => {
      invalidateRelated();
      queryClient.invalidateQueries({ queryKey: [resourceKey, variables.id, activeOrganizationId] });
    },
  });

  // 5. Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (payload: BulkDeletePayload) => {
      const endpoint = endpoints.bulkDelete || `${endpoints.list}/bulk-delete`;
      const { data } = await apiClient.post(endpoint, payload);
      return data as { success: boolean; count: number };
    },
    onSuccess: () => invalidateRelated(),
  });

  // 6. Export Query (Direct Trigger)
  const exportQuery = async (): Promise<any[]> => {
    const endpoint = endpoints.export || `${endpoints.list}/export`;
    const { data } = await apiClient.get(endpoint);
    return data;
  };

  // 7. Import Mutation
  const importMutation = useMutation({
    mutationFn: async (payload: any[]) => {
      const endpoint = endpoints.import || `${endpoints.list}/import`;
      const { data } = await apiClient.post(endpoint, payload);
      return data as ImportResult;
    },
    onSuccess: () => invalidateRelated(),
  });

  return {
    query,
    deleteMutation,
    createMutation,
    updateMutation,
    bulkDeleteMutation,
    exportQuery,
    importMutation,
  };
}
