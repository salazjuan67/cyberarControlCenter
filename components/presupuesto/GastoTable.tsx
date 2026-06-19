"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Gasto } from "@/types";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ESTADO_COLORS: Record<string, string> = {
  Pendiente:  "border-yellow-300 dark:border-yellow-500/40 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  Confirmado: "border-blue-300 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Pagado:     "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const CAT_COLORS: Record<string, string> = {
  Técnica:        "border-cyan-200 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  Streaming:      "border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Catering:       "border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300",
  Marketing:      "border-pink-200 dark:border-pink-500/30 bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-300",
  Diseño:         "border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300",
  Merchandising:  "border-yellow-200 dark:border-yellow-500/30 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  Personal:       "border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300",
  Infraestructura:"border-slate-200 dark:border-slate-400/30 bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-300",
  Otros:          "border-slate-200 dark:border-slate-600/30 bg-slate-50 dark:bg-slate-700/10 text-slate-500 dark:text-slate-400",
};

interface GastoTableProps {
  gastos: Gasto[];
  onEdit: (g: Gasto) => void;
  onDelete: (id: string) => void;
}

export function GastoTable({ gastos, onEdit, onDelete }: GastoTableProps) {
  if (gastos.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <p className="text-slate-400 dark:text-slate-500 text-sm">No se encontraron gastos.</p>
      </div>
    );
  }

  const totalPresupuesto = gastos.reduce((a, g) => a + g.presupuestoEstimado, 0);
  const totalReal = gastos.reduce((a, g) => a + g.costoReal, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              {["Concepto","Categoría","Presupuesto","Real","Desvío","Estado","Proveedor","Fecha Pago",""].map((h, i) => (
                <th key={i} className={`px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider ${i >= 2 && i <= 4 ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {gastos.map((g) => {
              const desvio = g.costoReal > 0 && g.presupuestoEstimado > 0
                ? ((g.costoReal - g.presupuestoEstimado) / g.presupuestoEstimado) * 100 : null;
              return (
                <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="text-slate-800 dark:text-slate-200 font-medium leading-tight">{g.concepto}</p>
                    {g.notas && <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 truncate max-w-48">{g.notas}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("text-xs", CAT_COLORS[g.categoria])}>{g.categoria}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(g.presupuestoEstimado)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={g.costoReal > 0 ? "text-slate-800 dark:text-slate-200" : "text-slate-300 dark:text-slate-600"}>
                      {g.costoReal > 0 ? formatCurrency(g.costoReal) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {desvio !== null ? (
                      <span className={cn("text-xs font-medium",
                        desvio <= 0 ? "text-emerald-600 dark:text-emerald-400" : desvio <= 10 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"
                      )}>{desvio > 0 ? "+" : ""}{desvio.toFixed(1)}%</span>
                    ) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("text-xs", ESTADO_COLORS[g.estado])}>{g.estado}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{g.proveedor || "—"}</td>
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">{formatDate(g.fechaPago)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" onClick={() => onEdit(g)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDelete(g.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-slate-200 dark:border-slate-700">
            <tr className="bg-slate-50 dark:bg-slate-950/40">
              <td className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase" colSpan={2}>Total</td>
              <td className="px-4 py-3 text-right text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(totalPresupuesto)}</td>
              <td className="px-4 py-3 text-right text-sm font-bold text-slate-900 dark:text-white">{totalReal > 0 ? formatCurrency(totalReal) : "—"}</td>
              <td colSpan={5}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
