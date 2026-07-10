"use client";

import { useLayout, LayoutProvider } from "@/components/providers/LayoutContext";
import { DataProvider } from "@/components/providers/DataProvider";
import { Sidebar } from "@/components/layout/Sidebar";

function MainLayoutInner({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useLayout();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />

      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <DataProvider>{children}</DataProvider>
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
