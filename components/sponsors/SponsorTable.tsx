"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Sponsor } from "@/types";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIA_COLORS: Record<string, string> = {
  Platino:      "border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300",
  Oro:          "border-yellow-300 dark:border-yellow-500/40 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  Plata:        "border-slate-300 dark:border-slate-400/40 bg-slate-50 dark:bg-slate-400/10 text-slate-600 dark:text-slate-300",
  Bronce:       "border-orange-300 dark:border-orange-500/40 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300",
  Institucional:"border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
};

const ESTADO_COLORS: Record<string, string> = {
  Confirmado:         "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "En negociación":   "border-blue-300 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "Propuesta enviada":"border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300",
  Contactado:         "border-yellow-300 dark:border-yellow-500/40 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  Lead:               "border-slate-200 dark:border-slate-500/40 bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400",
  Perdido:            "border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300",
};

const SEMAFORO: Record<string, string> = {
  Confirmado: "bg-emerald-400", "En negociación": "bg-blue-400",
  "Propuesta enviada": "bg-purple-400", Contactado: "bg-yellow-400",
  Lead: "bg-slate-400", Perdido: "bg-red-400",
};

interface SponsorTableProps {
  sponsors: Sponsor[];
  onEdit: (sponsor: Sponsor) => void;
  onDelete: (id: string) => void;
}

export function SponsorTable({ sponsors, onEdit, onDelete }: SponsorTableProps) {
  if (sponsors.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <p className="text-slate-400 dark:text-slate-500 text-sm">No se encontraron sponsors con los filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <th className="text-left px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider w-4"></th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Empresa</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Categoría</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Estado</th>
              <th className="text-right px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Monto Est.</th>
              <th className="text-right px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Confirmado</th>
              <th className="text-center px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Prob.</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Responsable</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Último contacto</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Próxima acción</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {sponsors.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="px-4 py-3">
                  <div className={cn("w-2 h-2 rounded-full", SEMAFORO[s.estado] || "bg-slate-400")} />
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-none">{s.empresa}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{s.contacto}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn("text-xs", CATEGORIA_COLORS[s.categoria])}>{s.categoria}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn("text-xs whitespace-nowrap", ESTADO_COLORS[s.estado])}>{s.estado}</Badge>
                </td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                  {s.montoEstimado > 0 ? formatCurrency(s.montoEstimado, s.moneda) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={s.montoConfirmado > 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-300 dark:text-slate-600"}>
                    {s.montoConfirmado > 0 ? formatCurrency(s.montoConfirmado, s.moneda) : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="h-1.5 rounded-full w-12 bg-slate-100 dark:bg-slate-800">
                      <div className={cn("h-1.5 rounded-full",
                        s.probabilidad >= 75 ? "bg-emerald-500" : s.probabilidad >= 40 ? "bg-yellow-500" : "bg-red-500"
                      )} style={{ width: `${s.probabilidad}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-8 text-right">{s.probabilidad}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{s.responsable || "—"}</td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">{formatDate(s.ultimoContacto)}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs max-w-48 truncate">{s.proximaAccion || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(s)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(s.id)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
