import { Link, useLocation } from "react-router-dom";
import { Dashboard, Document, Folder, Tag, User } from "@carbon/icons-react";
import type { CarbonIconType } from "@carbon/icons-react";

import { Button } from "@onecms/ui/components/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@onecms/ui/components/sheet";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@onecms/ui/components/tooltip";
import { cn } from "@onecms/ui/lib/utils";
import { useAuth } from "../auth/auth-context";
import { useOrganization } from "../auth/organization-context";
import { ChevronsUpDown, ChevronRight, LayoutDashboard, Plus } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@onecms/ui/components/dropdown-menu";

type RailItem = {
	title: string;
	href: string;
	icon: CarbonIconType;
	match: "exact" | "prefix";
};

const ITEMS: RailItem[] = [
	{ title: "Dashboard", href: "/dashboard", icon: Dashboard, match: "exact" },
	{ title: "Users", href: "/users", icon: User, match: "prefix" },
	{ title: "Posts", href: "/posts", icon: Document, match: "prefix" },
	{ title: "Categories", href: "/categories", icon: Folder, match: "prefix" },
	{ title: "Tags", href: "/tags", icon: Tag, match: "prefix" },
];

function isActive(item: RailItem, pathname: string): boolean {
	return (
		pathname === item.href ||
		(item.match === "prefix" && pathname.startsWith(item.href))
	);
}

function RailLink({
	item,
	active,
  expanded
}: {
	item: RailItem;
	active: boolean;
  expanded?: boolean;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					asChild
					variant="ghost"
					className={cn(
						"h-10 text-muted-foreground transition-all duration-300 ease-in-out justify-start px-2.5",
						active &&
							"bg-muted text-foreground hover:bg-muted hover:text-foreground",
					)}
				>
					<Link
						to={item.href}
						aria-current={active ? "page" : undefined}
						className="flex items-center"
					>
						<item.icon size={20} className="shrink-0" />
						<span 
              className={cn(
                "whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden",
                expanded ? "ml-3 opacity-100 max-w-[200px]" : "ml-0 opacity-0 max-w-0"
              )}
            >
              {item.title}
            </span>
					</Link>
				</Button>
			</TooltipTrigger>
			{!expanded && <TooltipContent side="right">{item.title}</TooltipContent>}
		</Tooltip>
	);
}

function MobileRailLink({
	item,
	active,
	onNavigate,
}: {
	item: RailItem;
	active: boolean;
	onNavigate: () => void;
}) {
	return (
		<Button
			asChild
			variant="ghost"
			className={cn(
				"justify-start gap-3 text-muted-foreground",
				active &&
					"bg-muted text-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			<Link
				to={item.href}
				aria-current={active ? "page" : undefined}
				onClick={onNavigate}
			>
				<item.icon size={20} />
				<span>{item.title}</span>
			</Link>
		</Button>
	);
}

export function AppIconRail({ 
  mobileOpen, 
  setMobileOpen,
  desktopExpanded 
}: { 
  mobileOpen: boolean; 
  setMobileOpen: (open: boolean) => void;
  desktopExpanded: boolean;
}) {
	const location = useLocation();
	const pathname = location.pathname;
  const { memberships } = useAuth();
  const { activeOrganizationId, setActiveOrganizationId } = useOrganization();
  const activeOrg = memberships.find(m => m.organization.id === activeOrganizationId)?.organization;
  const label = activeOrg?.name || "OneCMS";

	return (
    <TooltipProvider>
      <nav
        aria-label="Primary"
        className={cn(
          "hidden shrink-0 flex-col gap-1 border-r py-3 md:flex transition-all duration-300 ease-in-out overflow-hidden",
          desktopExpanded ? "w-64 px-3" : "w-14 px-2"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={cn(
              "flex items-center h-12 px-2.5 mb-4 text-foreground cursor-pointer hover:bg-muted rounded-md transition-all duration-300 mx-1",
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
            {memberships.map((m) => (
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

        {ITEMS.map((item) => (
          <RailLink
            key={item.href}
            item={item}
            active={isActive(item, pathname)}
            expanded={desktopExpanded}
          />
        ))}
      </nav>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 gap-0 p-0">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 p-2">
            {ITEMS.map((item) => (
              <MobileRailLink
                key={item.href}
                item={item}
                active={isActive(item, pathname)}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
	);
}
