"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { AsistentePotencial } from "@/types/asistentes";
import { formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  paymentStatusLabel,
  registrationStatusClass,
  registrationStatusLabel,
} from "@/lib/asistentes/registration-display";

const ESTADO_COLORS: Record<string, string> = {
  Inscripto: "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Interesado: "border-blue-300 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "Invitación enviada": "border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300",
  Contactado: "border-yellow-300 dark:border-yellow-500/40 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  Lead: "border-slate-200 dark:border-slate-500/40 bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400",
  "No interesado": "border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300",
};

interface AsistenteTableProps {
  asistentes: AsistentePotencial[];
  onEdit: (asistente: AsistentePotencial) => void;
  onDelete: (id: string) => void;
}

export function AsistenteTable({ asistentes, onEdit, onDelete }: AsistenteTableProps) {
  if (asistentes.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <p className="text-slate-400 dark:text-slate-500 text-sm">
          No hay asistentes potenciales. Agregá contactos para hacer seguimiento y envíos.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium uppercase">Nombre</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium uppercase">Organización</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium uppercase">Categoría</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium uppercase">Modalidad</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium uppercase">Estado</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium uppercase">Inscripción</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium uppercase">Origen</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium uppercase">Último contacto</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {asistentes.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="px-4 py-3">
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {[a.nombre, a.apellido].filter(Boolean).join(" ") || "—"}
                  </p>
                  {a.cargo && <p className="text-xs text-slate-400">{a.cargo}</p>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                  {a.email || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.organizacion || "—"}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.categoria}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.modalidad || "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn("text-xs", ESTADO_COLORS[a.estado])}>
                    {a.estado}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {a.registrationStatus ? (
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", registrationStatusClass(a.registrationStatus))}
                      >
                        {registrationStatusLabel(a.registrationStatus)}
                      </Badge>
                      <p className="text-[10px] text-slate-400">
                        {paymentStatusLabel(a.paymentStatus)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{a.origen || "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(a.ultimoContacto)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(a)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => onDelete(a.id)}
                    >
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
