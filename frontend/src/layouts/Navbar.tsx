// src/components/Navbar.tsx
import * as React from "react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function Navbar({
  title,
  mobileSidebar,
}: {
  title: string;
  mobileSidebar?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2">
          {/* Mobile: open the sidebar options regardless of desktop collapsed state */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              {mobileSidebar}
            </SheetContent>
          </Sheet>

          <h1 className="text-base sm:text-lg font-semibold truncate pt-2">
            {title}
          </h1>
        </div>

        {/* Right-side */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground"></div>
      </div>
    </header>
  );
}
