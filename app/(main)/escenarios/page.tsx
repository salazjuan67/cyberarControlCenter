"use client";

import { useStore } from "@/store/useStore";
import { calcEscenario } from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Header } from "@/components/layout/Header";
import { ScenarioCard } from "@/components/escenarios/ScenarioCard";
import { ScenarioChart } from "@/components/escenarios/ScenarioChart";
import { cn } from "@/lib/utils";

export default function EscenariosPage() {
  const { escenarios, updateEscenario } = useStore();
  const results = escenarios.map(calcEscenario);
  const expected = results.find((r) => r.tipo === "Esperado")!;

  return (
    <div className="flex flex-col flex-1">
      <Header title="Escenarios Financieros" subtitle="Proyección y simulación de resultados" badge="Análisis" />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm mb-4">Comparación de Escenarios — Resultado Neto</h3>
          <div className="space-y-3">
            {results.map((r) => {
              const max = Math.max(...results.map((x) => Math.abs(x.resultadoNeto)));
              const pct = max > 0 ? (Math.abs(r.resultadoNeto) / max) * 100 : 0;
              const color = r.tipo === "Conservador" ? "bg-yellow-500" : r.tipo === "Esperado" ? "bg-cyan-500" : "bg-emerald-500";
              const isPositive = r.resultadoNeto >= 0;
              return (
                <div key={r.tipo}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{r.tipo}</span>
                    <span className={cn("text-sm font-bold", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                      {isPositive ? "+" : ""}{formatCurrency(r.resultadoNeto)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className={cn("h-2 rounded-full", color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {results.map((r) => (
            <ScenarioCard key={r.tipo} result={r} expectedResult={expected} onUpdate={(u) => updateEscenario(r.tipo, u)} />
          ))}
        </div>

        <ScenarioChart results={results} />
      </div>
    </div>
  );
}
