import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePosts } from './use-posts';
import { apiClient } from '../api/client';
import React from 'react';

// Mock the dependencies
vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    delete: vi.fn(),
  }
}));

vi.mock('../auth/organization-context', () => ({
  useOrganization: () => ({ activeOrganizationId: 'org-123' })
}));

describe('usePosts', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('fetches posts successfully', async () => {
    const mockData = { items: [{ id: 1, title: 'Test Post' }], total: 1 };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => usePosts(), { wrapper });

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith('/posts?');
    expect(result.current.query.data).toEqual(mockData);
  });

  it('passes tableQuery parameters correctly', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { items: [], total: 0 } });

    const { result } = renderHook(() => usePosts({ page: 2, pageSize: 20, sort: 'title', dir: 'desc' }), { wrapper });

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith('/posts?page=2&limit=20&sort=title&dir=desc');
  });

  it('invalidates queries on successful delete', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { success: true } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => usePosts(), { wrapper });

    result.current.deleteMutation.mutate('post-123');

    await waitFor(() => expect(result.current.deleteMutation.isSuccess).toBe(true));

    expect(apiClient.delete).toHaveBeenCalledWith('/post/post-123');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['posts'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard', 'stats', 'org-123'] });
  });
});
