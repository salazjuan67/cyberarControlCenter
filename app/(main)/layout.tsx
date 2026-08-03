"use client";

import { useLayout, LayoutProvider } from "@/components/providers/LayoutContext";
import { DataProvider } from "@/components/providers/DataProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { SaveErrorBanner } from "@/components/layout/SaveErrorBanner";
import { cn } from "@/lib/utils";

function MainLayoutInner({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useLayout();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />

      <main
        className={cn(
          "flex-1 min-h-screen flex flex-col transition-[margin] duration-200 ease-in-out",
          !sidebarCollapsed && "md:ml-64"
        )}
      >
        <DataProvider>
          <SaveErrorBanner />
          {children}
        </DataProvider>
      </main>
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <MainLayoutInner>{children}</MainLayoutInner>
    </LayoutProvider>
  );
}
