import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@onecms/ui/components/card';
import { FileText, FolderTree, Tags } from 'lucide-react';
import { useOrganization } from '../auth/organization-context';
import { useAuth } from '../auth/auth-context';
import { useDashboardStats } from '../hooks/use-dashboard';
import { 
  PageShell, 
  PageShellHeader, 
  PageShellTitle, 
  PageShellDescription,
  PageShellContent
} from '../components/page-shell';

export function Dashboard() {
  const { activeOrganizationId } = useOrganization();
  const { user } = useAuth();
  
  const statsQuery = useDashboardStats().query;
  const isLoading = statsQuery.isLoading;
  const stats = statsQuery.data;

  return (
    <PageShell>
      <PageShellHeader>
        <PageShellTitle>Dashboard</PageShellTitle>
        <PageShellDescription>
          Welcome back, {user?.firstName}. Overview of your CMS content.
        </PageShellDescription>
      </PageShellHeader>

      <PageShellContent>
        {!activeOrganizationId ? (
          <div className="flex h-[400px] items-center justify-center border rounded-lg bg-background">
            <p className="text-muted-foreground">Please select an organization to view dashboard.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '-' : (stats?.posts || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <FolderTree className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '-' : (stats?.categories || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tags</CardTitle>
                <Tags className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '-' : (stats?.tags || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </PageShellContent>
    </PageShell>
  );
}
