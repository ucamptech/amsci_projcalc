import { ArrowLeft, Bell, LogOut, Menu, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isNumeric } from "@/lib/utils/date.utils";
import { useAuth } from "@/contexts/AuthContext";

interface NavigationProps {
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
}

export function Navigation({
  onMenuClick,
  isSidebarCollapsed,
}: NavigationProps) {
  // TODO Mock user
  const MOCK_USER = { name: "Percy Jackson", email: "test@example.com" };
  const MOCK_UNREAD_COUNT = 1;

  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const routeTitles: Record<string, string> = {
    "/": "Dashboard",
    "/projects": "Projects",
    "/projects/create": "Create new project",
  };

  const segments = location.pathname.split("/").filter(Boolean);
  const canGoBack = segments.length > 1;

  const isProjectDetails =
    segments[0] === "projects" &&
    segments.length === 2 && // exactly /projects/:id
    isNumeric(segments[1]);

  console.log(typeof segments[1]);

  const currentTitle =
    routeTitles[location.pathname] ??
    (isProjectDetails ? "Project details" : "");

  return (
    <header
      className={cn(
        "bg-background/95 supports-backdrop-filter:bg-background/60 fixed top-0 right-0 left-0 z-40 h-16 border-b backdrop-blur",
        // Shift navbar to start after the sidebar on desktop
        isSidebarCollapsed ? "md:left-16" : "md:left-64",
        // Smooth shift when collapsing/expanding
        "transition-[left,width] duration-300 ease-in-out",
      )}
    >
      <div className="flex h-full items-center gap-3 px-4 md:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-1 md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile logo + dynamic title + optional back button */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-primary-foreground font-bold">PJ</span>
          </div>

          {canGoBack && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="hover:bg-accent flex h-9 w-9 items-center justify-center rounded-lg transition active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <span className="max-w-[180px] truncate text-sm font-semibold">
            {currentTitle}
          </span>
        </div>

        {/* Desktop dynamic title + optional back button */}
        <div className="hidden items-center gap-3 md:flex">
          {canGoBack && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Go back"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <div className="flex flex-col">
            <span className="text-sm leading-tight font-semibold">
              {currentTitle}
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />

            {/* Notifications */}
            <span
              className={cn(
                "absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white",
                MOCK_UNREAD_COUNT > 0 ? "opacity-100" : "opacity-0",
              )}
            >
              {MOCK_UNREAD_COUNT}
            </span>
          </Button>

          <span className="hidden text-sm font-medium md:block">
            {MOCK_USER.name}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {MOCK_USER.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-semibold">
                {MOCK_USER.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
