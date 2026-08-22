import React, { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { useMasterTypes } from '../../hooks/use-masters';
import { Database, Settings2, Loader2 } from 'lucide-react';
import { AppHeader } from '../../components/app-header';
import { Toaster } from '@onecms/ui/components/sonner';
import { AppSidebar } from '../../components/app-sidebar';
import { BackHeader } from '../../components/back-header';

export function MastersLayout() {
  const { query } = useMasterTypes();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopExpanded, setDesktopExpanded] = React.useState(true);

  const sections = useMemo(() => {
    const baseSections = [
      {
        title: "System Configuration",
        items: [
          { title: "Masters", href: "/masters", icon: Settings2, match: "exact" as const }
        ]
      },
      {
        title: "Dictionaries",
        items: query.data?.map(type => ({
          title: type.name,
          href: `/masters/${type.slug}`,
          match: "exact" as const
        })) || []
      }
    ];
    return baseSections;
  }, [query.data]);

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      <AppSidebar 
        header={<BackHeader desktopExpanded={desktopExpanded} title="Master Data" icon={Database} />}
        sections={sections}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        desktopExpanded={desktopExpanded}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        <AppHeader setMobileOpen={setMobileOpen} desktopExpanded={desktopExpanded} setDesktopExpanded={setDesktopExpanded} />
        
        {query.isLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-muted overflow-hidden z-50">
            <div className="h-full bg-primary/50 w-1/3 animate-[slide_1s_ease-in-out_infinite]" />
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden relative">
          <Outlet />
        </div>
      </div>
      <Toaster />
    </div>
  );
}
