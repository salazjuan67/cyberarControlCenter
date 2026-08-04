"use client";

import type { AsistenteCategoria, AsistenteEstado, AsistentePotencial } from "@/types/asistentes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mail, Pencil } from "lucide-react";

const STAGES: AsistenteEstado[] = [
  "Lead",
  "Contactado",
  "Invitación enviada",
  "Interesado",
  "Inscripto",
  "No interesado",
];

const STAGE_STYLES: Record<
  AsistenteEstado,
  { border: string; header: string; empty: string }
> = {
  Lead: {
    border: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40",
    header: "text-slate-500 dark:text-slate-400",
    empty: "border-slate-200 dark:border-slate-700/50",
  },
  Contactado: {
    border: "border-yellow-200 dark:border-yellow-700/40 bg-yellow-50 dark:bg-yellow-900/10",
    header: "text-yellow-600 dark:text-yellow-400",
    empty: "border-yellow-200 dark:border-yellow-700/30",
  },
  "Invitación enviada": {
    border: "border-purple-200 dark:border-purple-700/40 bg-purple-50 dark:bg-purple-900/10",
    header: "text-purple-600 dark:text-purple-400",
    empty: "border-purple-200 dark:border-purple-700/30",
  },
  Interesado: {
    border: "border-blue-200 dark:border-blue-700/40 bg-blue-50 dark:bg-blue-900/10",
    header: "text-blue-600 dark:text-blue-400",
    empty: "border-blue-200 dark:border-blue-700/30",
  },
  Inscripto: {
    border: "border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/10",
    header: "text-emerald-600 dark:text-emerald-400",
    empty: "border-emerald-200 dark:border-emerald-700/30",
  },
  "No interesado": {
    border: "border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10",
    header: "text-red-500 dark:text-red-400",
    empty: "border-red-200 dark:border-red-800/30",
  },
};

const CAT_COLORS: Record<AsistenteCategoria, string> = {
  Profesional: "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30",
  Estudiante: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30",
  Militar: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
  Investigador: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30",
  Invitado: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
  Expositor: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30",
};

function displayName(a: AsistentePotencial): string {
  return [a.nombre, a.apellido].filter(Boolean).join(" ") || a.email || "Sin nombre";
}

export function AsistentePipeline({
  asistentes,
  onEdit,
}: {
  asistentes: AsistentePotencial[];
  onEdit: (a: AsistentePotencial) => void;
}) {
  const byStage = STAGES.reduce<Record<AsistenteEstado, AsistentePotencial[]>>((acc, stage) => {
    acc[stage] = asistentes.filter((a) => a.estado === stage);
    return acc;
  }, {} as Record<AsistenteEstado, AsistentePotencial[]>);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STAGES.map((stage) => {
        const items = byStage[stage];
        const avgProb =
          items.length > 0
            ? Math.round(items.reduce((sum, a) => sum + a.probabilidad, 0) / items.length)
            : 0;
        const st = STAGE_STYLES[stage];

        return (
          <div key={stage} className="flex-shrink-0 w-56">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className={cn("text-xs font-semibold uppercase tracking-wider leading-tight", st.header)}>
                {stage}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{items.length}</span>
            </div>
            {items.length > 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-600 mb-2 px-1">
                Prob. prom. {avgProb}%
              </p>
            )}
            <div className="space-y-2 min-h-24">
              {items.map((a) => (
                <div
                  key={a.id}
                  className={cn("rounded-lg border p-3 group cursor-pointer transition-all", st.border)}
                  onClick={() => onEdit(a)}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-slate-700 dark:text-slate-200 text-xs font-medium leading-tight flex-1">
                      {displayName(a)}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-900 dark:hover:text-white flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(a);
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                  {a.organizacion && (
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 truncate">{a.organizacion}</p>
                  )}
                  <Badge
                    variant="outline"
                    className={cn("text-xs mt-1.5 px-1.5 py-0", CAT_COLORS[a.categoria])}
                  >
                    {a.categoria}
                  </Badge>
                  {a.email && (
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-1 truncate flex items-center gap-1">
                      <Mail className="w-2.5 h-2.5 shrink-0" />
                      {a.email}
                    </p>
                  )}
                  {a.origen && (
                    <p className="text-slate-400 dark:text-slate-600 text-[10px] mt-1 truncate">{a.origen}</p>
                  )}
                  {a.proximaAccion && (
                    <p className="text-slate-400 dark:text-slate-600 text-xs mt-1 leading-tight truncate">
                      {a.proximaAccion}
                    </p>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <div className={cn("rounded-lg border border-dashed p-4 text-center", st.empty)}>
                  <p className="text-slate-400 dark:text-slate-600 text-xs">Sin contactos</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
