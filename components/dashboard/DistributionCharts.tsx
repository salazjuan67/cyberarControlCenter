"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Sponsor, Inscripcion } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useChartColors } from "@/lib/useChartColors";

const STATUS_COLORS: Record<string, string> = {
  Confirmado: "#34d399",
  "En negociación": "#60a5fa",
  "Propuesta enviada": "#a78bfa",
  Contactado: "#fbbf24",
  Lead: "#94a3b8",
  Perdido: "#f87171",
};

const MODAL_COLORS = ["#06b6d4", "#6366f1"];

export function SponsorStatusChart({ sponsors }: { sponsors: Sponsor[] }) {
  const c = useChartColors();

  const byStatus = Object.entries(
    sponsors.reduce<Record<string, number>>((acc, s) => {
      acc[s.estado] = (acc[s.estado] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm mb-3">Sponsors por Estado</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={byStatus} cx="50%" cy="42%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
            {byStatus.map((entry) => (
              <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#64748b"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: c.tooltipTitle }}
            itemStyle={{ color: c.tooltipLabel }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: c.legendColor }}
            iconType="circle"
            iconSize={7}
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IngresosFuenteChart({ inscripcionesTotal, sponsorsTotal }: { inscripcionesTotal: number; sponsorsTotal: number }) {
  const c = useChartColors();
  const total = inscripcionesTotal + sponsorsTotal;

  const data = [
    { name: "Inscripciones", value: inscripcionesTotal },
    { name: "Sponsors", value: sponsorsTotal },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm mb-3">Distribución de Ingresos</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="42%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={MODAL_COLORS[index % MODAL_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: c.tooltipTitle }}
            formatter={(value, name) => [
              typeof value === "number" ? formatCurrency(value) : String(value),
              `${name} (${total > 0 && typeof value === "number" ? ((value / total) * 100).toFixed(0) : 0}%)`,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: c.legendColor }}
            iconType="circle"
            iconSize={7}
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InscripcionesModalidadChart({ inscripciones }: { inscripciones: Inscripcion[] }) {
  const c = useChartColors();

  const presencial = inscripciones.filter((i) => i.modalidad === "Presencial").reduce((a, b) => a + b.cantidadConfirmada, 0);
  const virtual = inscripciones.filter((i) => i.modalidad === "Virtual").reduce((a, b) => a + b.cantidadConfirmada, 0);

  const data = [
    { name: "Presencial", value: presencial },
    { name: "Virtual", value: virtual },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm mb-3">Inscripciones por Modalidad</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="42%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={MODAL_COLORS[index % MODAL_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: c.tooltipTitle }}
            itemStyle={{ color: c.tooltipLabel }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: c.legendColor }}
            iconType="circle"
            iconSize={7}
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
