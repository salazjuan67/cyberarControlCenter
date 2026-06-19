"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { EscenarioResultado, EscenarioConfig } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const STYLES: Record<string, { border: string; tag: string; accent: string; valueBg: string }> = {
  Conservador: {
    border:   "border-yellow-200 dark:border-yellow-500/20",
    tag:      "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30",
    accent:   "text-yellow-600 dark:text-yellow-400",
    valueBg:  "bg-yellow-50 dark:bg-slate-800/40 border-yellow-100 dark:border-slate-700/30",
  },
  Esperado: {
    border:   "border-cyan-200 dark:border-cyan-500/20",
    tag:      "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30",
    accent:   "text-cyan-600 dark:text-cyan-400",
    valueBg:  "bg-cyan-50 dark:bg-slate-800/40 border-cyan-100 dark:border-slate-700/30",
  },
  Optimista: {
    border:   "border-emerald-200 dark:border-emerald-500/20",
    tag:      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
    accent:   "text-emerald-600 dark:text-emerald-400",
    valueBg:  "bg-emerald-50 dark:bg-slate-800/40 border-emerald-100 dark:border-slate-700/30",
  },
};

interface ScenarioCardProps {
  result: EscenarioResultado;
  expectedResult: EscenarioResultado;
  onUpdate: (updates: Partial<EscenarioConfig>) => void;
}

export function ScenarioCard({ result, expectedResult, onUpdate }: ScenarioCardProps) {
  const [expanded, setExpanded] = useState(false);
  const st = STYLES[result.tipo];
  const isPositive = result.resultadoNeto >= 0;
  const diffVsExpected = result.resultadoNeto - expectedResult.resultadoNeto;
  const isExpected = result.tipo === "Esperado";

  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-xl border p-5 flex flex-col gap-4", st.border)}>
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border", st.tag)}>{result.tipo}</span>
        {!isExpected && (
          <span className={cn("text-xs", diffVsExpected > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
            {diffVsExpected > 0 ? "+" : ""}{formatCurrency(diffVsExpected)} vs Esp.
          </span>
        )}
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-0.5">Resultado Neto</p>
        <p className={cn("text-2xl font-bold", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
          {isPositive ? "+" : ""}{formatCurrency(result.resultadoNeto)}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Margen: <span className={cn(st.accent, "font-medium")}>{formatPercent(result.margen, 1)}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Ingresos", value: formatCurrency(result.ingresosTotales) },
          { label: "Egresos", value: formatCurrency(result.egresosTotales) },
          { label: "Asist. Pres.", value: String(result.asistentesPresenciales) },
          { label: "Asist. Virt.", value: String(result.asistentesVirtuales) },
          { label: "Sponsors", value: String(result.sponsorsConfirmados + result.sponsorsPotenciales) },
          { label: "Break Even", value: Math.round(result.breakEven) + " asis." },
        ].map((item) => (
          <div key={item.label} className={cn("rounded-lg border p-2", st.valueBg)}>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-none">{item.label}</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {expanded ? "Ocultar configuración" : "Editar parámetros"}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          {[
            { label: "Asistentes Presenciales", field: "asistentesPresenciales" as const, max: 1000, step: 10 },
            { label: "Asistentes Virtuales", field: "asistentesVirtuales" as const, max: 2000, step: 25 },
            { label: "Sponsors Confirmados", field: "sponsorsConfirmados" as const, max: 20, step: 1 },
            { label: "Sponsors Potenciales", field: "sponsorsPotenciales" as const, max: 20, step: 1 },
            { label: "Precio Prom. Presencial", field: "precioPromPresencial" as const, max: 300, step: 5 },
            { label: "Precio Prom. Virtual", field: "precioPromVirtual" as const, max: 150, step: 5 },
            { label: "Monto Prom. Sponsor", field: "montoPromSponsor" as const, max: 10000, step: 100 },
          ].map((item) => (
            <div key={item.field}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">{item.label}</label>
                <span className={cn("text-xs font-semibold", st.accent)}>
                  {item.field.toLowerCase().includes("precio") || item.field.toLowerCase().includes("monto")
                    ? formatCurrency(result[item.field])
                    : result[item.field]}
                </span>
              </div>
              <input type="range" min={0} max={item.max} step={item.step} value={result[item.field]}
                onChange={(e) => onUpdate({ [item.field]: +e.target.value })} className="w-full accent-cyan-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
