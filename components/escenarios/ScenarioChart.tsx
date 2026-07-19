"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { EscenarioResultado, Moneda } from "@/types";
import { formatCurrency, MONEDA_LABELS } from "@/lib/formatters";
import { useChartColors } from "@/lib/useChartColors";

function ScenarioChartByMoneda({ results, moneda }: { results: EscenarioResultado[]; moneda: Moneda }) {
  const c = useChartColors();

  const data = results.map((r) => ({
    name: r.tipo,
    Ingresos: r.ingresosTotales,
    Egresos: r.egresosTotales,
    "Resultado Neto": r.resultadoNeto,
  }));

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}` }} className="rounded-lg p-3 shadow-xl text-xs">
        <p style={{ color: c.tooltipTitle }} className="font-medium mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span style={{ color: c.tooltipLabel }}>{p.name}:</span>
            <span style={{ color: c.tooltipTitle }} className="font-medium">{formatCurrency(p.value, moneda)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm mb-4">
        Comparación de Escenarios <span className="text-slate-400 font-mono font-normal">({MONEDA_LABELS[moneda]})</span>
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={6} barCategoryGap="40%">
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: c.axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: c.axisMuted, fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => formatCurrency(v, moneda, true)} width={70} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: c.cursorFill }} />
          <Legend wrapperStyle={{ fontSize: 12, color: c.legendColor, paddingTop: 8 }} />
          <Bar dataKey="Ingresos" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Egresos" fill="#f87171" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Resultado Neto" fill="#34d399" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScenarioChart({ results }: { results: EscenarioResultado[] }) {
  const monedas = [...new Set(results.map((r) => r.moneda))];

  return (
    <div className="space-y-4">
      {monedas.map((moneda) => (
        <ScenarioChartByMoneda
          key={moneda}
          moneda={moneda}
          results={results.filter((r) => r.moneda === moneda)}
        />
      ))}
    </div>
  );
}
