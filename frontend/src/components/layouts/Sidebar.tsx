import { FolderKanban, LayoutDashboard, Plus, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  /** Mobile state */
  isOpen: boolean;
  onClose: () => void;

  /** Desktop state */
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Create new project", href: "/projects/create", icon: Plus },
];

export function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="bg-background/80 fixed inset-0 z-50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-background fixed top-0 left-0 z-50 h-full border-r shadow-sm",
          "transition-[width,transform] duration-300 ease-in-out",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full",
          "md:translate-x-0",
          isCollapsed ? "md:w-16" : "md:w-64",
        )}
      >
        <div className="flex h-full flex-col gap-2 p-4">
          {/* App Header */}
          <div
            className="mb-4 flex h-12 cursor-pointer items-center justify-between border-b pr-2 select-none"
            onClick={onToggleCollapse}
          >
            <div className="flex items-center gap-3 transition-all duration-300">
              {/* App Logo */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                <img
                  src="/amsci-logo-symbol.png"
                  alt="AMSci"
                  className="h-10 w-auto object-contain"
                  loading="lazy"
                />
              </div>

              {/* Title + Description */}
              <div
                className={cn(
                  "flex flex-col whitespace-nowrap transition-[opacity,max-width] duration-200 ease-out",
                  isCollapsed
                    ? "md:max-w-0 md:overflow-hidden md:opacity-0"
                    : "md:max-w-40 md:opacity-100",
                )}
              >
                <span className="truncate leading-tight font-semibold">
                  AMSCI
                </span>
                <span className="text-muted-foreground text-xs">
                  Project Charter App
                </span>
              </div>
            </div>

            {/* Mobile close button only */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link key={item.href} to={item.href} onClick={onClose}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 transition-colors duration-200",
                      isCollapsed && "md:justify-center md:gap-0",
                      isActive &&
                        "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary",
                    )}
                  >
                    <Icon className="h-5 w-5" />

                    <span
                      className={cn(
                        "text-sm whitespace-nowrap transition-opacity duration-200",
                        isCollapsed
                          ? "md:hidden md:opacity-0"
                          : "md:opacity-100",
                      )}
                    >
                      {item.name}
                    </span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
