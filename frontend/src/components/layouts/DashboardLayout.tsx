import { Footer } from "./Footer";
import { Navigation } from "./Navigation";
import { Sidebar } from "./Sidebar";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // desktop

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <Navigation
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <main
        className={cn(
          "flex-1 pt-16",
          // smooth margin change when collapsing sidebar
          "transition-[margin] duration-300 ease-in-out",
          isSidebarCollapsed ? "md:ml-16" : "md:ml-64",
        )}
      >
        <div className="container mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <Footer isSidebarCollapsed={isSidebarCollapsed} />
    </div>
  );
}
