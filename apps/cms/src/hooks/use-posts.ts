import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { TableQueryState } from '@onecms/ui/lib/table-query';
import { useOrganization } from '../auth/organization-context';
import { useCrudResource, type BulkDeletePayload } from './use-crud-resource';

export interface PostItem {
  id?: string;
  _id?: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  excerpt?: string;
  content?: string;
  authorId?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  } | string;
  categoryIds?: string[];
  tagIds?: string[];
  featuredImage?: string;
  youtubeUrl?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogImage?: string;
    keywords?: string;
    noIndex?: boolean;
  };
  createdAt?: string;
  publishedAt?: string;
}

export interface PostFormInput {
  title: string;
  slug: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  authorId?: string;
  categoryIds?: string[];
  tagIds?: string[];
  featuredImage?: string;
  youtubeUrl?: string;
  excerpt?: string;
  content?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogImage?: string;
    keywords?: string;
    noIndex?: boolean;
  };
  publishedAt?: string;
}

/**
 * usePosts Hook
 * 
 * Provides TanStack Query CRUD state management for Posts list and table interactions.
 */
export function usePosts(tableQuery?: TableQueryState) {
  const crud = useCrudResource<PostItem, PostFormInput, PostFormInput>(
    {
      resourceKey: 'posts',
      endpoints: {
        list: '/posts',
        single: '/post',
        bulkDelete: '/posts/bulk-delete',
        export: '/posts/export',
        import: '/posts/import',
      },
    },
    tableQuery
  );

  return {
    query: crud.query,
    deleteMutation: crud.deleteMutation,
  };
}

export function useBulkDeletePosts() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useOrganization();

  return useMutation({
    mutationFn: async (payload: BulkDeletePayload) => {
      const { data } = await apiClient.post('/posts/bulk-delete', payload);
      return data as { success: boolean; count: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', activeOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', activeOrganizationId] });
    },
  });
}

export function useExportPosts() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.get('/posts/export');
      return data;
    },
  });
}

export function useImportPosts() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useOrganization();

  return useMutation({
    mutationFn: async (payload: Array<Record<string, unknown>>) => {
      const { data } = await apiClient.post('/posts/import', payload);
      return data as { successCount: number; errors?: Array<{ row: number; data: unknown; error: string }> };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', activeOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', activeOrganizationId] });
    },
  });
}

/**
 * usePost Hook
 * 
 * Manages single post retrieval, creation, and updating in the editor.
 */
export function usePost(id: string | undefined) {
  const { activeOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id && id !== 'new');

  const query = useQuery<PostItem | null>({
    queryKey: ['post', id, activeOrganizationId],
    queryFn: async () => {
      if (!isEditing) return null;
      const { data } = await apiClient.get(`/post/${id}`);
      return data;
    },
    enabled: isEditing && Boolean(activeOrganizationId),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: PostFormInput) => {
      const { data } = await apiClient.post('/post', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', activeOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', activeOrganizationId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: PostFormInput }) => {
      const { data } = await apiClient.patch(`/post/${id}`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', activeOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.id, activeOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', activeOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', activeOrganizationId] });
    },
  });

  return { query, createMutation, updateMutation };
}
