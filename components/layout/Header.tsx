"use client";

import { Presentation, Sun, Moon, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLayout } from "@/components/providers/LayoutContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, badge, actions }: HeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { setSidebarOpen } = useLayout();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center px-4 md:px-6 gap-3 sticky top-0 z-20">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-slate-900 dark:text-white font-semibold text-base truncate">
            {title}
          </h1>
          {badge && (
            <Badge
              variant="outline"
              className="text-xs border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0 hidden sm:inline-flex"
            >
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-0.5 truncate hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/presentacion")}
          className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 gap-1.5 h-8 text-xs hidden sm:flex"
        >
          <Presentation className="w-3.5 h-3.5" />
          Presentar
        </Button>
      </div>
    </header>
  );
}
