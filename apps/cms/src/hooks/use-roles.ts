import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await apiClient.get('/settings/roles');
      // settingsController.getRoles returns an array directly: res.json(roles)
      return Array.isArray(data) ? data : data.data || [];
    },
    // Cache the roles indefinitely since they rarely change.
    // This serves as an enterprise-grade global state cache without redundant API calls.
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24, // Keep in garbage collection for 24 hours
  });
}
