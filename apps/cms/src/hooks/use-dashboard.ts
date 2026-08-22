import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useOrganization } from '../auth/organization-context';

export interface DashboardStats {
  posts: number;
  categories: number;
  tags: number;
}

export function useDashboardStats() {
  const { activeOrganizationId } = useOrganization();

  const query = useQuery({
    queryKey: ['dashboard', 'stats', activeOrganizationId],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardStats>('/dashboard');
      return data;
    },
    enabled: !!activeOrganizationId,
  });

  return { query };
}
