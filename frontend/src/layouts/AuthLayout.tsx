import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-dvh grid place-items-center bg-background text-foreground">
      <div className="w-full max-w-[420px] p-6 md:p-8 rounded-2xl border border-border bg-card shadow-sm">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <button
              disabled={true}
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
            <span className="text-lg font-semibold tracking-tight">
              Project Charter
            </span>
          </div>
        </div>

        {/* Nested route content */}
        <Outlet />
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Project Charter
      </div>
    </div>
  );
}
