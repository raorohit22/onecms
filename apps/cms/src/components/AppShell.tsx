import { Outlet } from 'react-router-dom';
import { useUIStore } from '../store/ui-store';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { TeamsHeader } from './teams-header';
import { Dashboard, Document, Folder, Tag, User } from "@carbon/icons-react";
import { Toaster } from '@onecms/ui/components/sonner';

export function AppShell() {
  const { mobileSidebarOpen, setMobileSidebarOpen, desktopSidebarExpanded, setDesktopSidebarExpanded } = useUIStore();

  const mainSections = [
    {
      items: [
        { title: "Dashboard", href: "/dashboard", icon: Dashboard, match: "exact" as const },
        { title: "Posts", href: "/posts", icon: Document, match: "prefix" as const },
        { title: "Categories", href: "/categories", icon: Folder, match: "prefix" as const },
        { title: "Tags", href: "/tags", icon: Tag, match: "prefix" as const },
        { title: "Users", href: "/users", icon: User, match: "prefix" as const },
      ]
    }
  ];

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      <AppSidebar 
        header={<TeamsHeader desktopExpanded={desktopSidebarExpanded} />}
        sections={mainSections}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        desktopExpanded={desktopSidebarExpanded}
      />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AppHeader setMobileOpen={setMobileSidebarOpen} desktopExpanded={desktopSidebarExpanded} setDesktopExpanded={setDesktopSidebarExpanded} />
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <Outlet />
        </div>
      </div>
      <Toaster />
    </div>
  );
}

