import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button, buttonVariants } from "@onecms/ui/components/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@onecms/ui/components/sheet";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@onecms/ui/components/tooltip";
import { cn } from "@onecms/ui/lib/utils";

export type SidebarItemData = {
  title: string;
  href: string;
  icon?: any;
  match?: "exact" | "prefix";
};

export type SidebarSectionData = {
  title?: string;
  items: SidebarItemData[];
};

function isActive(item: SidebarItemData, pathname: string): boolean {
  return (
    pathname === item.href ||
    (item.match === "prefix" && pathname.startsWith(item.href))
  );
}

function SidebarLink({
  item,
  active,
  expanded
}: {
  item: SidebarItemData;
  active: boolean;
  expanded: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-10 transition-all duration-300 ease-in-out justify-start px-2.5 font-medium",
            active
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {item.icon && <item.icon className="size-5 shrink-0" />}
          {!item.icon && <div className={cn("rounded-full bg-current opacity-60 shrink-0 mx-[5px]", expanded ? "size-2" : "size-2.5")} />}
          <span
            className={cn(
              "whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden text-left",
              expanded ? "ml-3 opacity-100 max-w-[200px]" : "ml-0 opacity-0 max-w-0"
            )}
          >
            {item.title}
          </span>
        </Link>
      </TooltipTrigger>
      {!expanded && <TooltipContent side="right">{item.title}</TooltipContent>}
    </Tooltip>
  );
}

function MobileSidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: SidebarItemData;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "justify-start gap-3 text-muted-foreground",
        active && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
      )}
    >
      <Link
        to={item.href}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
      >
        {item.icon && <item.icon className="size-5" />}
        {!item.icon && <div className="size-2 rounded-full bg-current opacity-60" />}
        <span>{item.title}</span>
      </Link>
    </Button>
  );
}

export function AppSidebar({
  header,
  sections,
  mobileOpen,
  setMobileOpen,
  desktopExpanded
}: {
  header: React.ReactNode;
  sections: SidebarSectionData[];
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  desktopExpanded: boolean;
}) {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <TooltipProvider>
      <nav
        aria-label="Primary"
        className={cn(
          "hidden shrink-0 flex-col gap-1 border-r py-3 md:flex transition-all duration-300 ease-in-out overflow-hidden bg-muted/30",
          desktopExpanded ? "w-64 px-3" : "w-14 px-2"
        )}
      >
        {/* Header Area */}
        <div className="mb-4">
          {header}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-1">
            {sections.map((section, idx) => (
              <React.Fragment key={idx}>
                {section.title && (
                  <div
                    className={cn(
                      "py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                      desktopExpanded ? "px-2.5 opacity-100 max-w-[200px]" : "px-0 opacity-0 max-w-0 hidden"
                    )}
                  >
                    {section.title}
                  </div>
                )}
                
                {section.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    active={isActive(item, pathname)}
                    expanded={desktopExpanded}
                  />
                ))}

                {idx < sections.length - 1 && (
                  <div className="my-2 border-t mx-2" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 gap-0 p-0 bg-background">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col overflow-y-auto p-2 gap-1">
            <div className="mb-2 p-2">
              {header}
            </div>
            {sections.map((section, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                {section.title && (
                  <div className="px-2 py-2 mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => (
                  <MobileSidebarLink
                    key={item.href}
                    item={item}
                    active={isActive(item, pathname)}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
                {idx < sections.length - 1 && (
                  <div className="my-2 border-t mx-2" />
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
