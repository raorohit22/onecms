import React from 'react';
import { LayoutGrid, Settings2, FileText, Database } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@onecms/ui/components/button';
import { DetailSheet, DetailSheetHeader, DetailSheetBody, DetailSheetMain, DetailSheetSection } from './detail-sheet';
import { cn } from '@onecms/ui/lib/utils';

export function AppSwitcher() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <Button variant="ghost" size="icon" className="size-8" title="App Switcher" onClick={() => setOpen(true)}>
        <LayoutGrid className="size-4" />
      </Button>

      <DetailSheet open={open} onOpenChange={setOpen}>
      <DetailSheetHeader 
        title="Applications" 
        description="Switch between active modules"
        onClose={() => setOpen(false)} 
      />
      <DetailSheetBody>
        <DetailSheetMain>
          <DetailSheetSection>
            <div className="grid grid-cols-2 gap-4 py-2">
          <AppCard 
            title="Masters"
            description="Manage Dictionary Data"
            icon={Database}
            onClick={() => handleNavigate('/masters')}
            active={window.location.pathname.startsWith('/masters')}
          />
          <AppCard 
            title="Settings"
            description="Global configuration"
            icon={Settings2}
            onClick={() => handleNavigate('/settings')}
            active={window.location.pathname.startsWith('/settings')}
          />
            </div>
          </DetailSheetSection>
        </DetailSheetMain>
      </DetailSheetBody>
    </DetailSheet>
    </>
  );
}

function AppCard({ title, description, icon: Icon, onClick, active }: any) {
  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all hover:bg-muted cursor-pointer text-center",
        active ? "border-primary bg-primary/5" : "border-transparent bg-muted/50"
      )}
    >
      <div className={cn(
        "p-3 rounded-full mb-2",
        active ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"
      )}>
        <Icon className="size-6" />
      </div>
      <div>
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
      </div>
    </div>
  );
}
