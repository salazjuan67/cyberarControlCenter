"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  BarChart3,
  Presentation,
  Settings,
  ChevronRight,
  X,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { useLayout } from "@/components/providers/LayoutContext";
import { useTheme } from "@/components/providers/ThemeProvider";

const navItems = [
  { label: "Dashboard",     href: "/dashboard",     icon: LayoutDashboard },
  { label: "Sponsors",      href: "/sponsors",       icon: Building2 },
  { label: "Inscripciones", href: "/inscripciones",  icon: Users },
  { label: "Presupuesto",   href: "/presupuesto",    icon: Wallet },
  { label: "Escenarios",    href: "/escenarios",     icon: BarChart3 },
  { label: "Presentación",  href: "/presentacion",   icon: Presentation },
  { label: "Configuración", href: "/configuracion",  icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useLayout();
  const { theme } = useTheme();

  const isDark = theme === "dark";
  const logoSrc = isDark ? "/logo-cyberar.png" : "/logo-cyberar-light.png";
  const logoStyle = isDark
    ? { mixBlendMode: "screen" as const, filter: "brightness(4) saturate(0.4)" }
    : {};

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen w-64 flex flex-col z-40",
        "transform transition-transform duration-200 ease-in-out",
        "md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        // Theme-aware sidebar background
        "bg-white dark:bg-slate-950",
        "border-r border-slate-200 dark:border-slate-800"
      )}
    >
      {/* Logo area */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 relative">
        {/* Mobile close */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-3 right-3 md:hidden text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={isDark ? "bg-slate-900 rounded-xl px-3 py-2" : ""}>
          <Image
            src={logoSrc}
            alt="CYBER.AR"
            width={180}
            height={60}
            className="w-full h-auto pr-6 md:pr-0"
            style={logoStyle}
            priority
          />
        </div>

        <p className="text-slate-400 dark:text-white/30 text-xs text-center mt-2 tracking-widest uppercase font-mono">
          Control Center
        </p>
      </div>

      {/* Event badge */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10">
        <div className="bg-slate-100 dark:bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-white/30 leading-none mb-0.5 font-mono">
              Evento
            </p>
            <p className="text-slate-800 dark:text-white/80 text-sm font-semibold">
              CYBER.AR 2026
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                isActive
                  ? [
                      // Active — light mode
                      "bg-cyan-50 text-cyan-700 border border-cyan-200",
                      // Active — dark mode
                      "dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/25",
                    ].join(" ")
                  : [
                      // Inactive — light mode
                      "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent",
                      // Inactive — dark mode
                      "dark:text-white/50 dark:hover:text-white dark:hover:bg-white/8",
                    ].join(" ")
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-cyan-600 dark:text-cyan-400"
                    : "text-slate-400 dark:text-white/30 group-hover:text-slate-600 dark:group-hover:text-white/70"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3 h-3 text-cyan-500 dark:text-cyan-500 opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100 dark:border-white/10 space-y-3">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 dark:text-white/40 dark:hover:text-red-400 dark:hover:bg-red-500/10 dark:hover:border-red-500/20 group"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 transition-colors text-slate-400 group-hover:text-red-500 dark:text-white/30 dark:group-hover:text-red-400" />
            <span>Cerrar sesión</span>
          </button>
        </form>
        <p className="text-xs text-slate-400 dark:text-white/20 text-center font-mono">
          v1.0.0 · Comité CYBER.AR 2026
        </p>
      </div>
    </aside>
  );
}
