"use client";

import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accent?: "cyan" | "emerald" | "blue" | "yellow" | "red" | "purple";
  className?: string;
}

const accentBorder: Record<string, string> = {
  cyan:    "border-cyan-500/30 dark:border-cyan-500/20",
  emerald: "border-emerald-500/30 dark:border-emerald-500/20",
  blue:    "border-blue-500/30 dark:border-blue-500/20",
  yellow:  "border-yellow-500/30 dark:border-yellow-500/20",
  red:     "border-red-500/30 dark:border-red-500/20",
  purple:  "border-purple-500/30 dark:border-purple-500/20",
};

const accentBg: Record<string, string> = {
  cyan:    "bg-cyan-50 dark:bg-cyan-500/5",
  emerald: "bg-emerald-50 dark:bg-emerald-500/5",
  blue:    "bg-blue-50 dark:bg-blue-500/5",
  yellow:  "bg-yellow-50 dark:bg-yellow-500/5",
  red:     "bg-red-50 dark:bg-red-500/5",
  purple:  "bg-purple-50 dark:bg-purple-500/5",
};

const iconStyles: Record<string, string> = {
  cyan:    "text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/10",
  emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10",
  blue:    "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10",
  yellow:  "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/10",
  red:     "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10",
  purple:  "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10",
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  accent = "cyan",
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 flex flex-col gap-3",
        "bg-white dark:bg-slate-900",
        accentBorder[accent],
        accentBg[accent],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider leading-none">
          {title}
        </p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconStyles[accent])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <p className="text-slate-900 dark:text-white text-2xl font-bold leading-none">{value}</p>
        {subtitle && (
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1.5">{subtitle}</p>
        )}
      </div>

      {trendLabel && (
        <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
          {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />}
          {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />}
          {trend === "neutral" && <Minus className="w-3.5 h-3.5 text-slate-400" />}
          <span
            className={cn(
              "text-xs",
              trend === "up" ? "text-emerald-600 dark:text-emerald-400"
                : trend === "down" ? "text-red-600 dark:text-red-400"
                : "text-slate-500 dark:text-slate-400"
            )}
          >
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}
