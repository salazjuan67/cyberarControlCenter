"use client";

import Link from "next/link";
import Image from "next/image";
import { X, CheckCircle2, TrendingUp, Users, Building2, Target } from "lucide-react";
import { useStore } from "@/store/useStore";
import { calcKPIs, calcSponsorsConfirmados, calcTotalInscripcionesProyectado, calcAsistentesPresenciales, calcAsistentesVirtuales, getActiveMonedas } from "@/lib/calculations";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { SponsorStatusChart, IngresosFuenteChart } from "@/components/dashboard/DistributionCharts";

export default function PresentacionPage() {
  const { sponsors, inscripciones, gastos, config } = useStore();
  const { theme } = useTheme();
  const activeMonedas = getActiveMonedas(sponsors, inscripciones, gastos);
  const primaryMoneda = activeMonedas[0] ?? config.moneda;
  const kpis = calcKPIs(
    sponsors,
    inscripciones,
    gastos,
    config.breakEvenMoneda === primaryMoneda ? config.breakEven : 0,
    primaryMoneda
  );
  const sponsorsIngresos = calcSponsorsConfirmados(sponsors, primaryMoneda);
  const inscripcionesProyTotal = calcTotalInscripcionesProyectado(inscripciones, primaryMoneda);
  const presConf = calcAsistentesPresenciales(inscripciones);
  const virtConf = calcAsistentesVirtuales(inscripciones);
  const isPositive = kpis.resultadoNeto >= 0;

  const isDark = theme === "dark";
  const logoSrc = isDark ? "/logo-cyberar.png" : "/logo-cyberar-light.png";
  const logoStyle = isDark
    ? { mixBlendMode: "screen" as const, filter: "brightness(4) saturate(0.4)" }
    : {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Exit bar */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Modo Presentación Ejecutiva</span>
        </div>
        <Link href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
          <X className="w-3.5 h-3.5" />Salir
        </Link>
      </div>

      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-5">
            <div className="w-24 md:w-36 flex-shrink-0">
              <Image src={logoSrc} alt="CYBER.AR" width={220} height={74}
                className="h-10 md:h-14 w-auto" style={logoStyle} priority />
            </div>
            <div className="border-l border-slate-300 dark:border-slate-700 pl-4 md:pl-5">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reporte Ejecutivo</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 font-mono">
                {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Break Even</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(kpis.breakEven, primaryMoneda)}</p>
            <p className={cn("text-sm font-semibold mt-0.5",
              kpis.avanceBreakEven >= 100 ? "text-emerald-600 dark:text-emerald-400" : kpis.avanceBreakEven >= 60 ? "text-cyan-600 dark:text-cyan-400" : "text-yellow-600 dark:text-yellow-400"
            )}>{formatPercent(kpis.avanceBreakEven, 0)} alcanzado</p>
          </div>
        </div>

        {/* Break Even Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Avance al Punto de Equilibrio</span>
            <span className={cn("text-lg font-bold", kpis.avanceBreakEven >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-cyan-600 dark:text-cyan-400")}>
              {formatPercent(kpis.avanceBreakEven, 0)}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
            <div className={cn("h-3 rounded-full transition-all", kpis.avanceBreakEven >= 100 ? "bg-emerald-500" : "bg-cyan-500")}
              style={{ width: `${Math.min(kpis.avanceBreakEven, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-slate-400 dark:text-slate-600">0</span>
            <span className="text-xs text-slate-400 dark:text-slate-600">{formatCurrency(kpis.breakEven, primaryMoneda)}</span>
          </div>
        </div>

        {/* Big stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          {[
            { label: "Ingresos Proyectados", value: formatCurrency(kpis.ingresosProyectados, primaryMoneda), sub: "Confirmados + ponderados", color: "text-cyan-600 dark:text-cyan-400", icon: TrendingUp },
            { label: "Gastos Proyectados", value: formatCurrency(kpis.gastosProyectados, primaryMoneda), sub: "Presupuesto total", color: "text-slate-700 dark:text-slate-300", icon: Target },
            { label: "Resultado Neto", value: (isPositive ? "+" : "") + formatCurrency(kpis.resultadoNeto, primaryMoneda), sub: isPositive ? "Superávit proyectado" : "Déficit proyectado",
              color: isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400", icon: CheckCircle2 },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <p className="text-slate-500 dark:text-slate-500 text-sm">{s.label}</p>
                <s.icon className={cn("w-5 h-5", s.color)} />
              </div>
              <p className={cn("text-2xl md:text-3xl font-bold", s.color)}>{s.value}</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Status row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Sponsors Confirmados", value: String(kpis.sponsorsConfirmados), sub: formatCurrency(sponsorsIngresos, primaryMoneda), icon: Building2, color: "text-purple-600 dark:text-purple-400" },
            { label: "En Negociación", value: String(kpis.sponsorsNegociacion), sub: "Sponsors activos", icon: Building2, color: "text-yellow-600 dark:text-yellow-400" },
            { label: "Asist. Presenciales", value: formatNumber(presConf), sub: `Meta: ${formatNumber(config.metaPresencial)}`, icon: Users, color: "text-cyan-600 dark:text-cyan-400" },
            { label: "Asist. Virtuales", value: formatNumber(virtConf), sub: `Meta: ${formatNumber(config.metaVirtual)}`, icon: Users, color: "text-blue-600 dark:text-blue-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={cn("w-4 h-4", s.color)} />
                <p className="text-slate-500 dark:text-slate-500 text-xs">{s.label}</p>
              </div>
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-slate-400 dark:text-slate-600 text-xs mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          <RevenueChart moneda={primaryMoneda}
            ingresosConfirmados={kpis.ingresosConfirmados} ingresosProyectados={kpis.ingresosProyectados}
            gastosConfirmados={kpis.gastosConfirmados} gastosProyectados={kpis.gastosProyectados} />
          <IngresosFuenteChart moneda={primaryMoneda}
            inscripcionesTotal={inscripcionesProyTotal}
            sponsorsTotal={Math.max(0, kpis.ingresosProyectados - inscripcionesProyTotal)} />
          <SponsorStatusChart sponsors={sponsors.filter((s) => s.moneda === primaryMoneda)} />
        </div>

        {/* Executive note */}
        <div className={cn("rounded-2xl border p-5 md:p-6",
          isPositive ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5" : "border-yellow-200 dark:border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/5"
        )}>
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className={cn("w-5 h-5", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-yellow-600 dark:text-yellow-400")} />
            <h3 className="text-slate-800 dark:text-white font-semibold">Nota Ejecutiva</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">
            <strong className="text-slate-900 dark:text-white">{config.nombreEvento}</strong> presenta un resultado proyectado{" "}
            <span className={cn("font-semibold", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
              {isPositive ? "positivo" : "negativo"}
            </span>{" "}
            de <strong className="text-slate-900 dark:text-white">{formatCurrency(Math.abs(kpis.resultadoNeto), primaryMoneda)}</strong>,
            con un avance del <strong className="text-cyan-600 dark:text-cyan-400">{formatPercent(kpis.avanceBreakEven, 0)}</strong>{" "}
            sobre el punto de equilibrio de <strong className="text-slate-900 dark:text-white">{formatCurrency(kpis.breakEven, primaryMoneda)}</strong>.
            El evento cuenta con <strong className="text-slate-900 dark:text-white">{kpis.sponsorsConfirmados} sponsors confirmados</strong>{" "}
            y <strong className="text-slate-900 dark:text-white">{kpis.sponsorsNegociacion} en negociación activa</strong>.
          </p>
        </div>

        <div className="text-center pb-4">
          <p className="text-slate-400 dark:text-slate-700 text-xs">
            {config.nombreEvento} · Comité Organizador · {new Date().toLocaleDateString("es-AR")}
          </p>
        </div>
      </div>
    </div>
  );
}
