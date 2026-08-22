import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { TableQueryState } from '@onecms/ui/lib/table-query';
import { useOrganization } from '../auth/organization-context';

export function useUsers(tableQuery?: TableQueryState) {
  const { activeOrganizationId } = useOrganization();
  return useQuery({
    queryKey: ['users', activeOrganizationId, tableQuery?.page, tableQuery?.pageSize, tableQuery?.sort, tableQuery?.dir],
    queryFn: async () => {
      let url = '/users?';
      if (tableQuery) {
        url += `page=${tableQuery.page}&limit=${tableQuery.pageSize}&sort=${tableQuery.sort}&dir=${tableQuery.dir}`;
      }
      const { data } = await apiClient.get(url);
      return data;
    },
    placeholderData: keepPreviousData
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: any) => {
      const { data } = await apiClient.post('/users', userData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await apiClient.put(`/users/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useBulkDeleteUsers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: { ids?: string[], selectAll?: boolean, excludedIds?: string[] }) => {
      const { data } = await apiClient.post('/users/bulk-delete', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useExportUsers() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.get('/users/export');
      return data;
    }
  });
}

export function useImportUsers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: any[]) => {
      const { data } = await apiClient.post('/users/import', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}
