import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/auth-context';
import { OrganizationProvider } from './auth/organization-context';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ThemeProvider } from './components/theme-provider';
import { AppShell } from './components/AppShell';
import { GlobalErrorBoundary } from './components/error-boundary';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Posts } from './pages/Posts';
import { PostEditor } from './pages/PostEditor';
import { Categories } from './pages/Categories';
import { Users } from './pages/users/Users';
import { Tags } from './pages/Tags';
import { MediaLibrary } from './pages/Media';

import { MastersLayout } from './pages/masters/MastersLayout';
import { MasterTypesAdmin } from './pages/masters/MasterTypesAdmin';
import { MasterDataGrid } from './pages/masters/MasterDataGrid';
import { SettingsLayout } from './pages/settings/SettingsLayout';
import { RbacSettings } from './pages/settings/RbacSettings';
import { ThemeSettings } from './pages/settings/ThemeSettings';
import { AbacSettings } from './pages/settings/AbacSettings';

import { QueryProvider } from './components/query-provider';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryProvider>
        <BrowserRouter>
          <NuqsAdapter>
            <AuthProvider>
              <OrganizationProvider>
                <GlobalErrorBoundary>
                  <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    
                    <Route path="posts" element={<Posts />} />
                    <Route path="posts/new" element={<PostEditor />} />
                    <Route path="posts/:id" element={<PostEditor />} />
                    
                    <Route path="master-types" element={<MasterTypesAdmin />} />
                    <Route path="users" element={<Users />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="tags" element={<Tags />} />
                    <Route path="media" element={<MediaLibrary />} />
                  </Route>

                  <Route path="/masters" element={<MastersLayout />}>
                    <Route index element={<MasterTypesAdmin />} />
                    <Route path=":slug" element={<MasterDataGrid />} />
                  </Route>

                  <Route path="/settings" element={<SettingsLayout />}>
                    <Route index element={<Navigate to="rbac" replace />} />
                    <Route path="rbac" element={<RbacSettings />} />
                    <Route path="abac" element={<AbacSettings />} />
                    <Route path="theme" element={<ThemeSettings />} />
                  </Route>
                </Route>
                </Routes>
                </GlobalErrorBoundary>
              </OrganizationProvider>
            </AuthProvider>
          </NuqsAdapter>
        </BrowserRouter>
      </QueryProvider>
    </ThemeProvider>
  );
}

export default App;
