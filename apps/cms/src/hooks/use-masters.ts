import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useOrganization } from '../auth/organization-context';
import type { TableQueryState } from './use-table-query';

export interface MasterType {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface MasterValue {
  id: string;
  masterTypeId: string;
  label: string;
  value: string;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
}

export function useMasterTypes() {
  const { activeOrganizationId } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['masterTypes', activeOrganizationId],
    queryFn: async () => {
      const res = await apiClient.get<any>('/masters/types');
      return res.data;
    },
    enabled: !!activeOrganizationId,
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<MasterType>) => {
      const res = await apiClient.post<any>('/masters/types', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterTypes', activeOrganizationId] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<MasterType> & { id: string }) => {
      const res = await apiClient.put<any>(`/masters/types/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterTypes', activeOrganizationId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/masters/types/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterTypes', activeOrganizationId] });
    }
  });

  return { query, createMutation, updateMutation, deleteMutation };
}

export function useMasterValues(typeSlug: string, tableQuery?: TableQueryState) {
  const { activeOrganizationId } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['masterValues', typeSlug, activeOrganizationId, tableQuery?.page, tableQuery?.pageSize, tableQuery?.sort, tableQuery?.dir],
    queryFn: async () => {
      if (!typeSlug) return { data: [], meta: { total: 0, page: 1, totalPages: 0 } };
      
      const params = new URLSearchParams();
      if (tableQuery) {
        params.append('page', tableQuery.page.toString());
        params.append('limit', tableQuery.pageSize.toString());
        params.append('sort', tableQuery.sort);
        params.append('dir', tableQuery.dir);
      }
      
      const res = await apiClient.get<any>(`/masters/${typeSlug}/data?${params.toString()}`);
      return res.data || { data: [], meta: { total: 0, page: 1, totalPages: 0 } };
    },
    enabled: !!activeOrganizationId && !!typeSlug,
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<MasterValue>) => {
      const res = await apiClient.post<any>(`/masters/${typeSlug}/data`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterValues', typeSlug, activeOrganizationId] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<MasterValue> & { id: string }) => {
      const res = await apiClient.patch<any>(`/masters/${typeSlug}/data/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterValues', typeSlug, activeOrganizationId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/masters/${typeSlug}/data/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterValues', typeSlug, activeOrganizationId] });
    }
  });

  const exportQuery = async () => {
    const res = await apiClient.get<any[]>(`/masters/${typeSlug}/data/export`);
    return res.data;
  };

  const importMutation = useMutation({
    mutationFn: async (payload: any[]) => {
      const res = await apiClient.post<any>(`/masters/${typeSlug}/data/import`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterValues', typeSlug, activeOrganizationId] });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (payload: { ids?: string[], selectAll?: boolean, excludedIds?: string[] }) => {
      const res = await apiClient.post<any>(`/masters/${typeSlug}/data/bulk-delete`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterValues', typeSlug, activeOrganizationId] });
    }
  });

  return { query, createMutation, updateMutation, deleteMutation, exportQuery, importMutation, bulkDeleteMutation };
}
