"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { Inscripcion } from "@/types";
import { useChartColors } from "@/lib/useChartColors";

export function InscripcionCharts({ inscripciones }: { inscripciones: Inscripcion[] }) {
  const c = useChartColors();

  const byCategoria = inscripciones.reduce<Record<string, { confirmados: number; proyectados: number }>>((acc, i) => {
    if (!acc[i.categoria]) acc[i.categoria] = { confirmados: 0, proyectados: 0 };
    acc[i.categoria].confirmados += i.cantidadConfirmada;
    acc[i.categoria].proyectados += i.cantidadProyectada;
    return acc;
  }, {});

  const barData = Object.entries(byCategoria).map(([name, v]) => ({
    name, Confirmados: v.confirmados, Proyectados: v.proyectados,
  }));

  const presencial = inscripciones.filter((i) => i.modalidad === "Presencial").reduce((a, i) => a + i.cantidadConfirmada, 0);
  const virtual = inscripciones.filter((i) => i.modalidad === "Virtual").reduce((a, i) => a + i.cantidadConfirmada, 0);

  const pieData = [{ name: "Presencial", value: presencial }, { name: "Virtual", value: virtual }];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm mb-4">Asistentes por Categoría</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barGap={4} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: c.axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: c.axisMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: c.tooltipTitle }}
              itemStyle={{ color: c.tooltipLabel }}
              cursor={{ fill: c.cursorFill }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: c.legendColor, paddingTop: 8 }} />
            <Bar dataKey="Confirmados" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Proyectados" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm mb-4">Presencial vs Virtual</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
              <Cell fill="#06b6d4" />
              <Cell fill="#6366f1" />
            </Pie>
            <Tooltip
              contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: c.tooltipTitle }}
              itemStyle={{ color: c.tooltipLabel }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: c.legendColor }} iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
