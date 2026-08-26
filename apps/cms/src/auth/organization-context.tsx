import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';

interface OrganizationContextType {
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { memberships, isAuthenticated } = useAuth();
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(() => {
    return localStorage.getItem('organizationId');
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveOrganizationId(null);
      return;
    }

    if (memberships.length > 0) {
      const storedOrgId = localStorage.getItem('organizationId');
      const hasStoredOrg = memberships.some(m => m.organization.id === storedOrgId);
      
      if (hasStoredOrg && storedOrgId) {
        if (activeOrganizationId !== storedOrgId) {
          setActiveOrganizationId(storedOrgId);
        }
      } else {
        const defaultOrgId = memberships[0].organization.id;
        setActiveOrganizationId(defaultOrgId);
        localStorage.setItem('organizationId', defaultOrgId);
      }
    }
  }, [memberships, isAuthenticated]);

  const handleSetOrganizationId = (id: string) => {
    setActiveOrganizationId(id);
    localStorage.setItem('organizationId', id);
    // Reload the window or trigger a re-fetch of all CMS data since the tenant changed
    window.location.href = '/dashboard';
  };

  return (
    <OrganizationContext.Provider value={{ activeOrganizationId, setActiveOrganizationId: handleSetOrganizationId }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
