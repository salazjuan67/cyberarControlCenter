"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Gasto } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useChartColors } from "@/lib/useChartColors";

export function GastoChart({ gastos }: { gastos: Gasto[] }) {
  const c = useChartColors();

  const byCategoria = gastos.reduce<Record<string, { presupuesto: number; real: number }>>((acc, g) => {
    if (!acc[g.categoria]) acc[g.categoria] = { presupuesto: 0, real: 0 };
    acc[g.categoria].presupuesto += g.presupuestoEstimado;
    acc[g.categoria].real += g.costoReal;
    return acc;
  }, {});

  const data = Object.entries(byCategoria).map(([name, v]) => ({
    name, Presupuesto: v.presupuesto, Real: v.real,
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
            <span style={{ color: c.tooltipTitle }} className="font-medium">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm mb-4">Distribución de Gastos por Categoría</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={4} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: c.axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: c.axisMuted, fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => formatCurrency(v, "USD", true)} width={65} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: c.cursorFill }} />
          <Legend wrapperStyle={{ fontSize: 12, color: c.legendColor, paddingTop: 8 }} />
          <Bar dataKey="Presupuesto" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Real" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
