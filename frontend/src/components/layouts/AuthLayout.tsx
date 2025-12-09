import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="from-primary/5 via-background to-primary/10 flex min-h-screen items-center justify-center bg-linear-to-br p-4">
      <div className="w-full max-w-md">{children}</div>

      {/* Footer */}
      <div className="text-muted-foreground absolute bottom-4 text-xs">
        © {new Date().getFullYear()} AMSCI - Project Charter App
      </div>
    </div>
  );
}
