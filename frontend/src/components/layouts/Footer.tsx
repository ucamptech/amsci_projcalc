import { cn } from "@/lib/utils";

interface FooterProps {
  isSidebarCollapsed: boolean;
}

export function Footer({ isSidebarCollapsed }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "py-6 transition-[margin] duration-300 ease-in-out md:py-6",
        isSidebarCollapsed ? "md:ml-16" : "md:ml-64",
      )}
    >
      <div className="container flex max-w-[1600px] flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
        <p className="text-muted-foreground text-sm">
          © {currentYear} AMSCI - Project Charter App
        </p>
        <p className="text-muted-foreground text-sm">version 1.0.0</p>
      </div>
    </footer>
  );
}
