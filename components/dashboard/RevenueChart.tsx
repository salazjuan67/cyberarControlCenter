"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { useChartColors } from "@/lib/useChartColors";

interface RevenueChartProps {
  ingresosConfirmados: number;
  ingresosProyectados: number;
  gastosConfirmados: number;
  gastosProyectados: number;
}

export function RevenueChart({
  ingresosConfirmados, ingresosProyectados, gastosConfirmados, gastosProyectados,
}: RevenueChartProps) {
  const c = useChartColors();

  const data = [
    { name: "Confirmado", Ingresos: ingresosConfirmados, Gastos: gastosConfirmados },
    { name: "Proyectado", Ingresos: ingresosProyectados, Gastos: gastosProyectados },
  ];

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
      <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm mb-4">Ingresos vs Gastos</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={8} barCategoryGap="40%">
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: c.axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: c.axisMuted, fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => formatCurrency(v, "USD", true)} width={70} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: c.cursorFill }} />
          <Legend wrapperStyle={{ fontSize: 12, color: c.legendColor, paddingTop: 8 }} />
          <Bar dataKey="Ingresos" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gastos" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
