"use client";

import { useState, useMemo } from "react";
import { Calculator } from "lucide-react";
import type { Inscripcion } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export function InscripcionSimulator({ inscripciones }: { inscripciones: Inscripcion[] }) {
  const avgP = useMemo(() => {
    const w = inscripciones.filter((i) => i.modalidad === "Presencial" && i.precioUnitario > 0);
    return w.length ? Math.round(w.reduce((a, i) => a + i.precioUnitario, 0) / w.length) : 80;
  }, [inscripciones]);

  const avgV = useMemo(() => {
    const w = inscripciones.filter((i) => i.modalidad === "Virtual" && i.precioUnitario > 0);
    return w.length ? Math.round(w.reduce((a, i) => a + i.precioUnitario, 0) / w.length) : 40;
  }, [inscripciones]);

  const [presencial, setPresencial] = useState(250);
  const [virtual, setVirtual] = useState(400);
  const [precioP, setPrecioP] = useState(avgP);
  const [precioV, setPrecioV] = useState(avgV);

  const ingP = presencial * precioP;
  const ingV = virtual * precioV;
  const total = ingP + ingV;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center gap-2 mb-5">
        <Calculator className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm">Simulador de Asistentes</h3>
        <span className="text-xs text-slate-400 dark:text-slate-500 ml-1 hidden sm:inline">— Ajustá los sliders para proyectar ingresos</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          {[
            { label: "Asistentes Presenciales", value: presencial, set: setPresencial, max: 500, step: 10, color: "text-cyan-600 dark:text-cyan-400", accent: "accent-cyan-500" },
            { label: "Asistentes Virtuales", value: virtual, set: setVirtual, max: 1000, step: 25, color: "text-purple-600 dark:text-purple-400", accent: "accent-purple-500" },
            { label: "Precio Prom. Presencial", value: precioP, set: setPrecioP, max: 200, step: 5, color: "text-slate-700 dark:text-white", accent: "accent-cyan-500", fmt: formatCurrency },
            { label: "Precio Prom. Virtual", value: precioV, set: setPrecioV, max: 100, step: 5, color: "text-slate-700 dark:text-white", accent: "accent-purple-500", fmt: formatCurrency },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-500 dark:text-slate-400">{item.label}</label>
                <span className={cn("text-sm font-semibold", item.color)}>
                  {item.fmt ? item.fmt(item.value) : formatNumber(item.value)}
                </span>
              </div>
              <input type="range" min={0} max={item.max} step={item.step} value={item.value}
                onChange={(e) => item.set(+e.target.value)} className={cn("w-full", item.accent)} />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {[
            { label: "Ingreso Presencial", value: ingP, color: "text-cyan-600 dark:text-cyan-400", bg: "border-cyan-200 dark:border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/10", sub: `${formatNumber(presencial)} × ${formatCurrency(precioP)}` },
            { label: "Ingreso Virtual", value: ingV, color: "text-purple-600 dark:text-purple-400", bg: "border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/10", sub: `${formatNumber(virtual)} × ${formatCurrency(precioV)}` },
            { label: "Total Proyectado", value: total, color: "text-emerald-600 dark:text-emerald-400", bg: "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10", sub: `${formatNumber(presencial + virtual)} asistentes totales` },
          ].map((item) => (
            <div key={item.label} className={cn("rounded-lg border p-4", item.bg)}>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{item.label}</p>
              <p className={cn("text-xl font-bold", item.color)}>{formatCurrency(item.value)}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
