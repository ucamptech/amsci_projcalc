import Footer from "@/layouts/Footer";
import Navbar from "@/layouts/Navbar";
import Sidebar from "@/layouts/Sidebar";
import { useState, type ReactNode } from "react";

export default function DashLayout({
  children,
  title = "Dashboard",
}: {
  children: ReactNode;
  title?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-h-screen">
        <Navbar
          title={title}
          mobileSidebar={
            <Sidebar collapsed={false} onToggleCollapse={() => {}} isMobile />
          }
        />

        <main className="flex-1 min-h-0 px-4 sm:px-6 py-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
