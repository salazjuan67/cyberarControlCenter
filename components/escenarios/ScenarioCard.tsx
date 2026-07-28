"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { EscenarioResultado, EscenarioConfig } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { MonedaSelect } from "@/components/shared/MonedaSelect";
import { Input } from "@/components/ui/input";
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

const inputCls =
  "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 h-8 text-sm";

interface ScenarioCardProps {
  result: EscenarioResultado;
  expectedResult: EscenarioResultado;
  onUpdate: (updates: Partial<EscenarioConfig>) => void;
}

type NumericField = keyof Pick<
  EscenarioConfig,
  | "asistentesPresenciales"
  | "asistentesVirtuales"
  | "sponsorsConfirmados"
  | "sponsorsPotenciales"
  | "gastosEstimados"
  | "precioPromPresencial"
  | "precioPromVirtual"
  | "montoPromSponsor"
>;

export function ScenarioCard({ result, expectedResult, onUpdate }: ScenarioCardProps) {
  const [expanded, setExpanded] = useState(false);
  const st = STYLES[result.tipo];
  const isPositive = result.resultadoNeto >= 0;
  const sameMoneda = result.moneda === expectedResult.moneda;
  const diffVsExpected = sameMoneda
    ? result.resultadoNeto - expectedResult.resultadoNeto
    : 0;
  const isExpected = result.tipo === "Esperado";
  const moneda = result.moneda;

  const countFields: { label: string; field: NumericField; max: number; step: number }[] = [
    { label: "Asistentes Presenciales", field: "asistentesPresenciales", max: 5000, step: 10 },
    { label: "Asistentes Virtuales", field: "asistentesVirtuales", max: 10000, step: 25 },
    { label: "Sponsors Confirmados", field: "sponsorsConfirmados", max: 100, step: 1 },
    { label: "Sponsors Potenciales", field: "sponsorsPotenciales", max: 100, step: 1 },
  ];

  const moneyFields: { label: string; field: NumericField; step: number }[] = [
    { label: "Gastos Estimados", field: "gastosEstimados", step: moneda === "ARS" ? 100000 : 500 },
    { label: "Precio Prom. Presencial", field: "precioPromPresencial", step: moneda === "ARS" ? 5000 : 5 },
    { label: "Precio Prom. Virtual", field: "precioPromVirtual", step: moneda === "ARS" ? 5000 : 5 },
    { label: "Monto Prom. Sponsor", field: "montoPromSponsor", step: moneda === "ARS" ? 50000 : 100 },
  ];

  function setField(field: NumericField, raw: string) {
    const value = Math.max(0, Number(raw) || 0);
    onUpdate({ [field]: value });
  }

  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-xl border p-5 flex flex-col gap-4", st.border)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border", st.tag)}>{result.tipo}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{moneda}</span>
        </div>
        {!isExpected && sameMoneda && (
          <span className={cn("text-xs", diffVsExpected > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
            {diffVsExpected > 0 ? "+" : ""}{formatCurrency(diffVsExpected, moneda)} vs Esp.
          </span>
        )}
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-0.5">Resultado Neto</p>
        <p className={cn("text-2xl font-bold", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
          {isPositive ? "+" : ""}{formatCurrency(result.resultadoNeto, moneda)}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Margen: <span className={cn(st.accent, "font-medium")}>{formatPercent(result.margen, 1)}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Ingresos", value: formatCurrency(result.ingresosTotales, moneda) },
          { label: "Egresos", value: formatCurrency(result.egresosTotales, moneda) },
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
        <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Moneda del escenario</label>
            <MonedaSelect
              value={result.moneda}
              onChange={(v) => onUpdate({ moneda: v })}
              className={inputCls}
            />
          </div>

          {countFields.map((item) => (
            <div key={item.field}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">{item.label}</label>
                <span className={cn("text-xs font-semibold", st.accent)}>{result[item.field]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={item.max}
                step={item.step}
                value={Math.min(result[item.field], item.max)}
                onChange={(e) => setField(item.field, e.target.value)}
                className="w-full accent-cyan-500"
              />
            </div>
          ))}

          <div className="space-y-3 pt-1">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Montos en {moneda} — ingresá el valor exacto (sin límite de miles).
            </p>
            {moneyFields.map((item) => (
              <div key={item.field}>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">{item.label}</label>
                <Input
                  type="number"
                  min={0}
                  step={item.step}
                  value={result[item.field]}
                  onChange={(e) => setField(item.field, e.target.value)}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
