import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Shield, Palette, FileCode2, Settings2 } from 'lucide-react';
import { AppHeader } from '../../components/app-header';
import { Toaster } from '@onecms/ui/components/sonner';
import { AppSidebar } from '../../components/app-sidebar';
import { BackHeader } from '../../components/back-header';

export function SettingsLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(true);

  const sections = [
    {
      title: "Access Control",
      items: [
        { title: "Roles & Permissions", href: "/settings/rbac", icon: Shield, match: "prefix" as const },
        { title: "ABAC Policies", href: "/settings/abac", icon: FileCode2, match: "prefix" as const }
      ]
    },
    {
      title: "Branding",
      items: [
        { title: "Theme Customization", href: "/settings/theme", icon: Palette, match: "prefix" as const }
      ]
    }
  ];

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      <AppSidebar 
        header={<BackHeader desktopExpanded={desktopExpanded} title="Global Settings" icon={Settings2} />}
        sections={sections}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        desktopExpanded={desktopExpanded}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <AppHeader setMobileOpen={setMobileOpen} desktopExpanded={desktopExpanded} setDesktopExpanded={setDesktopExpanded} />
        <main className="flex-1 overflow-auto bg-muted/10 relative">
          <Outlet />
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
