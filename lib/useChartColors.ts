"use client";

import { useTheme } from "@/components/providers/ThemeProvider";

export function useChartColors() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return {
    grid: isDark ? "#1e293b" : "#e2e8f0",
    axisColor: isDark ? "#94a3b8" : "#64748b",
    axisMuted: isDark ? "#64748b" : "#94a3b8",
    tooltipBg: isDark ? "#1e293b" : "#ffffff",
    tooltipBorder: isDark ? "#334155" : "#e2e8f0",
    tooltipTitle: isDark ? "#cbd5e1" : "#0f172a",
    tooltipLabel: isDark ? "#94a3b8" : "#64748b",
    legendColor: isDark ? "#94a3b8" : "#64748b",
    cursorFill: isDark ? "#1e293b" : "#f1f5f9",
  };
}
