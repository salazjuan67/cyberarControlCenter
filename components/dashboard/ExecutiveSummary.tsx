"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { KPIs } from "@/types";

interface ExecutiveSummaryProps {
  kpis: KPIs;
  eventoNombre: string;
}

export function ExecutiveSummary({ kpis, eventoNombre }: ExecutiveSummaryProps) {
  const isPositive = kpis.resultadoNeto > 0;
  const isOnTrack = kpis.avanceBreakEven >= 80;

  const progressColor =
    kpis.avanceBreakEven >= 100 ? "bg-emerald-500"
    : kpis.avanceBreakEven >= 70 ? "bg-cyan-500"
    : kpis.avanceBreakEven >= 40 ? "bg-yellow-500"
    : "bg-red-500";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        {isPositive
          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
          : <AlertTriangle className="w-4 h-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
        }
        <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm">Resumen Ejecutivo</h3>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">Avance al Break Even</span>
          <span className={cn("text-xs font-semibold", kpis.avanceBreakEven >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-cyan-600 dark:text-cyan-400")}>
            {formatPercent(kpis.avanceBreakEven, 0)}
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
          <div className={cn("h-2 rounded-full transition-all duration-500", progressColor)}
            style={{ width: `${Math.min(kpis.avanceBreakEven, 100)}%` }} />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Meta: {formatCurrency(kpis.breakEven, kpis.moneda)}</p>
      </div>

      {/* Summary text */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-100 dark:border-slate-700/50">
        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
          <span className="font-medium text-slate-900 dark:text-white">{eventoNombre}</span> presenta
          un resultado{" "}
          <span className={cn("font-semibold", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
            {isPositive ? "positivo" : "negativo"}
          </span>{" "}
          proyectado de{" "}
          <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(Math.abs(kpis.resultadoNeto), kpis.moneda)}</span>,
          con un avance del{" "}
          <span className="font-semibold text-cyan-600 dark:text-cyan-400">{formatPercent(kpis.avanceBreakEven, 0)}</span>{" "}
          sobre el punto de equilibrio.{" "}
          {kpis.sponsorsConfirmados > 0 && (
            <>Se cuentan con{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{kpis.sponsorsConfirmados} sponsors confirmados</span>{" "}
              y <span className="font-semibold text-yellow-600 dark:text-yellow-400">{kpis.sponsorsNegociacion} en gestión activa</span>.{" "}
            </>
          )}
          {isOnTrack
            ? <span className="text-emerald-600 dark:text-emerald-400">El evento está en buen camino financiero.</span>
            : <span className="text-yellow-600 dark:text-yellow-400">Se recomienda acelerar la confirmación de sponsors e inscripciones.</span>
          }
        </p>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/30">
          <p className="text-xs text-slate-500">Ingresos confirmados</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{formatCurrency(kpis.ingresosConfirmados, kpis.moneda)}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/30">
          <p className="text-xs text-slate-500">Gastos proyectados</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{formatCurrency(kpis.gastosProyectados, kpis.moneda)}</p>
        </div>
      </div>
    </div>
  );
}
