import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock context and hooks
vi.mock('../auth/organization-context', () => ({
  useOrganization: () => ({ 
    activeOrganizationId: 'org-123',
    organizations: [{ id: 'org-123', name: 'Test Org' }],
    setActiveOrganization: vi.fn(),
    refreshOrganizations: vi.fn()
  })
}));

vi.mock('../auth/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', firstName: 'John', lastName: 'Doe' },
    logout: vi.fn()
  })
}));

describe('AppShell Component', () => {
  it('renders the layout correctly', () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );
    
    // We expect a sidebar and topbar
    expect(screen.getByRole('navigation')).toBeInTheDocument(); // generic role for nav
    // Depending on the exact structure of AppShell, verify a logo or user menu is present
    // Let's assert text "Test Org" is present in the switcher
    expect(screen.getByText('Test Org')).toBeInTheDocument();
  });
});
