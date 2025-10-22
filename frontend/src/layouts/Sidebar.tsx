import * as React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { List, LogOut, Plus, Settings, User } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Separator } from "@/components/ui/separator";
import { api } from "@/api/api";

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  isMobile = false,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
}) {
  const effectiveCollapsed = isMobile ? false : collapsed;
  const MOCK_USER = { name: "Percy Jackson", email: "pjackson@gmail.com" };
  const navigate = useNavigate();

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  async function handleLogout() {
    console.log("logout");
    await api.logout();
    navigate("/login", { replace: true }); // redirect after logout
  }

  return (
    <aside
      aria-label="Sidebar navigation"
      className={[
        "sticky top-0 h-dvh",
        "overflow-hidden",
        "flex flex-col border-r bg-card transition-all duration-200",
        isMobile ? "w-full" : effectiveCollapsed ? "w-20" : "w-64",
        isMobile ? "" : "hidden md:flex",
      ].join(" ")}
    >
      {/* ------ Header  ------ */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
        <button
          type="button"
          onClick={() => {
            if (!isMobile) onToggleCollapse();
          }}
          aria-label={
            effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
          title={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring/60 focus:ring-offset-2 focus:ring-offset-card transition-transform active:scale-[0.98]"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        </button>

        {!effectiveCollapsed && (
          <div className="min-w-0">
            <p className="font-semibold leading-tight truncate">JANUS</p>
            <p className="text-xs text-muted-foreground leading-tight truncate">
              Project Charter App
            </p>
          </div>
        )}
      </div>

      {/* ------ Menu list  ------ */}
      <TooltipProvider delayDuration={200}>
        <nav
          className="flex-1 overflow-y-auto p-2"
          role="navigation"
          aria-label="Main navigation links"
        >
          <ul className="space-y-1">
            <li>
              <MaybeTooltip label="Projects" show={effectiveCollapsed}>
                <NavItem
                  to="/projects"
                  icon={<List className="h-4 w-4" />}
                  collapsed={effectiveCollapsed}
                  exact
                >
                  Projects
                </NavItem>
              </MaybeTooltip>
            </li>
            <li>
              <MaybeTooltip label="Create Project" show={effectiveCollapsed}>
                <NavItem
                  to="/projects/create"
                  icon={<Plus className="h-4 w-4" />}
                  collapsed={effectiveCollapsed}
                >
                  Create Project
                </NavItem>
              </MaybeTooltip>
            </li>
            {/* add more items… */}
          </ul>
        </nav>
      </TooltipProvider>

      {/* ------ Footer ------ */}
      <Separator className="my-1" />
      <div className="p-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-full flex items-center gap-3 rounded-md hover:bg-muted/60 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-ring/60"
              aria-label="Open user menu"
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="text-xs">
                  {getInitials(MOCK_USER.name)}
                </AvatarFallback>
              </Avatar>

              {!effectiveCollapsed && (
                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium leading-tight truncate">
                    {MOCK_USER.name}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight truncate">
                    {MOCK_USER.email}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={effectiveCollapsed ? "right" : "top"}
            align={effectiveCollapsed ? "end" : "start"}
            sideOffset={8}
            className="min-w-56"
          >
            <DropdownMenuItem asChild>
              <a href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem asChild>
              <a
                href="/signout"
                className="flex items-center gap-2 text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </a>
            </DropdownMenuItem> */}
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

/* ------ Helper subcomponents ------ */

function NavItem({
  to,
  icon,
  children,
  collapsed,
  exact = false,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsed: boolean;
  exact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted/50 text-foreground",
        ].join(" ")
      }
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{children}</span>}
    </NavLink>
  );
}

function MaybeTooltip({
  label,
  show,
  children,
}: {
  label: string;
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
