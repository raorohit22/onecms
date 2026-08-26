import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Membership {
  id: string;
  roleIds: string[];
  permissions: string[];
  organization: Organization;
}

interface AuthContextType {
  user: User | null;
  memberships: Membership[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refetchUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      const fetchedUser = response.data.user;
      const fetchedMemberships = response.data.memberships;
      setUser(fetchedUser);
      setMemberships(fetchedMemberships);

      if (fetchedMemberships && fetchedMemberships.length > 0) {
        const storedOrgId = localStorage.getItem('organizationId');
        const hasStoredOrg = fetchedMemberships.some((m: any) => m.organization.id === storedOrgId);
        if (!hasStoredOrg) {
          localStorage.setItem('organizationId', fetchedMemberships[0].organization.id);
        }
      }
    } catch (error) {
      setUser(null);
      setMemberships([]);
      localStorage.removeItem('organizationId');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Always attempt to refetch user on mount via HTTP-only cookie
    refetchUser();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (userData: User) => {
    setUser(userData);
    await refetchUser();
    navigate('/dashboard');
  };

  const logout = async () => {
    // 1. Immediately clear client-side state and navigate to login to ensure instant, responsive UI logout
    localStorage.removeItem('organizationId');
    setUser(null);
    setMemberships([]);
    navigate('/login');

    // 2. Best-effort server-side session revocation. Errors are safely ignored because the client
    // is already cleared and cookies will be overwritten/expired by the server on subsequent requests.
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Intentional no-op: network failures during logout should not prevent the user from being logged out locally
    }
  };

  return (
    <AuthContext.Provider value={{ user, memberships, isAuthenticated: !!user, isLoading, login, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
