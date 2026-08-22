import { Asleep, Light, Logout, UserAvatar } from "@carbon/icons-react";
import { PanelLeft, Menu } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useAuth } from "../auth/auth-context";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@onecms/ui/components/avatar";
import { Button } from "@onecms/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@onecms/ui/components/dropdown-menu";
import { AppSwitcher } from "./app-switcher";

export function AppHeader({
  setMobileOpen,
  desktopExpanded,
  setDesktopExpanded,
}: {
  setMobileOpen: (v: boolean) => void;
  desktopExpanded: boolean;
  setDesktopExpanded: (v: boolean) => void;
}) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 [view-transition-name:app-header] bg-background">
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex"
          aria-label="Toggle navigation"
          onClick={() => setDesktopExpanded(!desktopExpanded)}
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <AppSwitcher />
        <UserMenu user={user} onSignOut={logout} />
      </div>
    </header>
  );
}

function UserMenu({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`
    : "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Account menu"
          className="hover:bg-transparent aria-expanded:bg-transparent dark:hover:bg-transparent size-8"
        >
          <Avatar className="size-7">
            {user?.avatarUrl && (
              <AvatarImage alt={user.firstName} src={user.avatarUrl} />
            )}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <UserAvatar size={16} />
          <span className="min-w-0 truncate">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            setTheme(isDark ? "light" : "dark");
          }}
          className="cursor-pointer"
        >
          {isDark ? (
            <Light size={16} className="mr-2" />
          ) : (
            <Asleep size={16} className="mr-2" />
          )}
          {isDark ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onSignOut}
          className="text-red-600 focus:text-red-600 cursor-pointer"
        >
          <Logout size={16} className="mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
