import React from "react";
import { useAuth } from "../auth/auth-context";
import { useOrganization } from "../auth/organization-context";
import { ChevronsUpDown, ChevronRight, LayoutDashboard, Plus } from "lucide-react";
import { cn } from "@onecms/ui/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@onecms/ui/components/dropdown-menu";

export function TeamsHeader({ desktopExpanded }: { desktopExpanded: boolean }) {
  const { memberships } = useAuth();
  const { activeOrganizationId, setActiveOrganizationId } = useOrganization();
  const activeOrg = memberships?.find(m => m.organization.id === activeOrganizationId)?.organization;
  const label = activeOrg?.name || "OneCMS";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={cn(
          "flex items-center h-12 px-2.5 text-foreground cursor-pointer hover:bg-muted rounded-md transition-all duration-300 mx-1",
          desktopExpanded ? "justify-start gap-2" : "justify-center"
        )}>
          <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white flex shrink-0 items-center justify-center border shadow-sm">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          
          <div className={cn(
            "flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
            desktopExpanded ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
          )}>
            <span className="truncate text-sm font-semibold">{label}</span>
            <span className="truncate text-xs text-muted-foreground">Enterprise</span>
          </div>
          
          <div className={cn(
            "ml-auto shrink-0 transition-all duration-300",
            desktopExpanded ? "opacity-100 w-4" : "opacity-0 w-0"
          )}>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={desktopExpanded ? "start" : "center"} side="right" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Teams</DropdownMenuLabel>
        {memberships?.map((m) => (
          <DropdownMenuItem 
            key={m.organization.id} 
            onClick={() => setActiveOrganizationId(m.organization.id)}
            className="flex items-center gap-2 py-2 cursor-pointer"
          >
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0 border">
              {m.organization.name.charAt(0)}
            </div>
            <span className="truncate text-sm">{m.organization.name}</span>
            {activeOrganizationId === m.organization.id && (
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 py-2 cursor-pointer text-muted-foreground">
          <div className="h-6 w-6 rounded flex items-center justify-center shrink-0 border">
            <Plus className="h-4 w-4" />
          </div>
          <span className="text-sm">Add team</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
