"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Gasto, Moneda } from "@/types";
import { formatCurrency, MONEDA_LABELS } from "@/lib/formatters";
import { getActiveMonedas } from "@/lib/calculations";
import { useChartColors } from "@/lib/useChartColors";

function GastoChartByMoneda({ gastos, moneda }: { gastos: Gasto[]; moneda: Moneda }) {
  const c = useChartColors();
  const filtered = gastos.filter((g) => g.moneda === moneda);

  const byCategoria = filtered.reduce<Record<string, { presupuesto: number; real: number }>>((acc, g) => {
    if (!acc[g.categoria]) acc[g.categoria] = { presupuesto: 0, real: 0 };
    acc[g.categoria].presupuesto += g.presupuestoEstimado;
    acc[g.categoria].real += g.costoReal;
    return acc;
  }, {});

  const data = Object.entries(byCategoria).map(([name, v]) => ({
    name, Presupuesto: v.presupuesto, Real: v.real,
  }));

  if (data.length === 0) return null;

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
        Distribución de Gastos por Categoría <span className="text-slate-400 font-mono font-normal">({MONEDA_LABELS[moneda]})</span>
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={4} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: c.axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: c.axisMuted, fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => formatCurrency(v, moneda, true)} width={65} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: c.cursorFill }} />
          <Legend wrapperStyle={{ fontSize: 12, color: c.legendColor, paddingTop: 8 }} />
          <Bar dataKey="Presupuesto" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Real" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GastoChart({ gastos }: { gastos: Gasto[] }) {
  const monedas = getActiveMonedas([], [], gastos);

  if (monedas.length === 0) return null;

  return (
    <div className="space-y-4">
      {monedas.map((moneda) => (
        <GastoChartByMoneda key={moneda} gastos={gastos} moneda={moneda} />
      ))}
    </div>
  );
}
