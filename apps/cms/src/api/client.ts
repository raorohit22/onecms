import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  
  const orgId = localStorage.getItem('organizationId');
  if (orgId) {
    config.headers['X-Organization-Id'] = orgId;
  }
  return config;
});

export interface ApiError {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Standardize error format
    const normalizedError: ApiError = {
      status: error.response?.status || 500,
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      details: error.response?.data?.details,
    };
    
    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth/');
    
    // Auto-refresh logic on 401 (only for non-auth endpoints or /auth/me)
    if (
      normalizedError.status === 401 && 
      originalRequest && 
      !originalRequest._retry && 
      (!isAuthEndpoint || originalRequest.url === '/auth/me')
    ) {
      originalRequest._retry = true;
      try {
        await apiClient.post('/auth/refresh');
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, user is actually logged out
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(normalizedError);
      }
    }

    // Catch 401 globally if needed (for endpoints that aren't retried)
    if (normalizedError.status === 401 && originalRequest?.url === '/auth/refresh') {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    
    // Attach the normalized error back onto the promise rejection
    return Promise.reject(normalizedError);
  }
);
