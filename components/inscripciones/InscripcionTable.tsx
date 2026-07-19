"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Inscripcion } from "@/types";
import { formatCurrency, formatNumber, formatTotalsByMoneda, sumByMoneda } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MODAL_COLORS: Record<string, string> = {
  Presencial: "border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  Virtual:    "border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300",
};

const CAT_COLORS: Record<string, string> = {
  Profesional: "border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300",
  Estudiante:  "border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300",
  Militar:     "border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300",
  Investigador:"border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-300",
  Invitado:    "border-slate-200 dark:border-slate-400/30 text-slate-600 dark:text-slate-300",
  Expositor:   "border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300",
};

interface InscripcionTableProps {
  inscripciones: Inscripcion[];
  onEdit: (i: Inscripcion) => void;
  onDelete: (id: string) => void;
}

export function InscripcionTable({ inscripciones, onEdit, onDelete }: InscripcionTableProps) {
  const totalAConf = inscripciones.reduce((a, i) => a + i.cantidadConfirmada, 0);
  const totalAProy = inscripciones.reduce((a, i) => a + i.cantidadProyectada, 0);
  const confByMoneda = sumByMoneda(inscripciones, (i) => i.precioUnitario * i.cantidadConfirmada);
  const proyByMoneda = sumByMoneda(inscripciones, (i) => i.precioUnitario * i.cantidadProyectada);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              {["Categoría","Modalidad","Precio Unit.","Confirmados","Proyectados","Ingreso Conf.","Ingreso Proy.",""].map((h, i) => (
                <th key={i} className={`px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider ${i >= 2 ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {inscripciones.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn("text-xs", CAT_COLORS[i.categoria])}>{i.categoria}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn("text-xs", MODAL_COLORS[i.modalidad])}>{i.modalidad}</Badge>
                </td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                  {i.precioUnitario > 0 ? formatCurrency(i.precioUnitario, i.moneda) : <span className="text-slate-400 dark:text-slate-600">Gratis</span>}
                </td>
                <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-semibold">{formatNumber(i.cantidadConfirmada)}</td>
                <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{formatNumber(i.cantidadProyectada)}</td>
                <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                  {i.precioUnitario > 0 ? formatCurrency(i.precioUnitario * i.cantidadConfirmada, i.moneda) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-cyan-600 dark:text-cyan-400">
                  {i.precioUnitario > 0 ? formatCurrency(i.precioUnitario * i.cantidadProyectada, i.moneda) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(i)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(i.id)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200 dark:border-slate-700">
            <tr className="bg-slate-50 dark:bg-slate-950/40">
              <td className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase" colSpan={3}>Total</td>
              <td className="px-4 py-3 text-right text-sm font-bold text-slate-900 dark:text-white">{formatNumber(totalAConf)}</td>
              <td className="px-4 py-3 text-right text-sm font-bold text-slate-600 dark:text-slate-300">{formatNumber(totalAProy)}</td>
              <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatTotalsByMoneda(confByMoneda)}</td>
              <td className="px-4 py-3 text-right text-sm font-bold text-cyan-600 dark:text-cyan-400">{formatTotalsByMoneda(proyByMoneda)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
