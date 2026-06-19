"use client";

import type { Sponsor, SponsorEstado } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

const STAGES: SponsorEstado[] = ["Lead","Contactado","Propuesta enviada","En negociación","Confirmado","Perdido"];

const STAGE_STYLES: Record<SponsorEstado, { border: string; header: string; empty: string }> = {
  Lead:               { border: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40",        header: "text-slate-500 dark:text-slate-400",       empty: "border-slate-200 dark:border-slate-700/50" },
  Contactado:         { border: "border-yellow-200 dark:border-yellow-700/40 bg-yellow-50 dark:bg-yellow-900/10", header: "text-yellow-600 dark:text-yellow-400",      empty: "border-yellow-200 dark:border-yellow-700/30" },
  "Propuesta enviada":{ border: "border-purple-200 dark:border-purple-700/40 bg-purple-50 dark:bg-purple-900/10", header: "text-purple-600 dark:text-purple-400",      empty: "border-purple-200 dark:border-purple-700/30" },
  "En negociación":   { border: "border-blue-200 dark:border-blue-700/40 bg-blue-50 dark:bg-blue-900/10",         header: "text-blue-600 dark:text-blue-400",          empty: "border-blue-200 dark:border-blue-700/30" },
  Confirmado:         { border: "border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/10", header: "text-emerald-600 dark:text-emerald-400", empty: "border-emerald-200 dark:border-emerald-700/30" },
  Perdido:            { border: "border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10",             header: "text-red-500 dark:text-red-400",            empty: "border-red-200 dark:border-red-800/30" },
};

const CAT_COLORS: Record<string, string> = {
  Platino:      "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30",
  Oro:          "text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30",
  Plata:        "text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/30",
  Bronce:       "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30",
  Institucional:"text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30",
};

export function SponsorPipeline({ sponsors, onEdit }: { sponsors: Sponsor[]; onEdit: (s: Sponsor) => void }) {
  const byStage = STAGES.reduce<Record<SponsorEstado, Sponsor[]>>((acc, stage) => {
    acc[stage] = sponsors.filter((s) => s.estado === stage);
    return acc;
  }, {} as Record<SponsorEstado, Sponsor[]>);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STAGES.map((stage) => {
        const items = byStage[stage];
        const total = items.reduce((a, s) => a + (s.montoConfirmado > 0 ? s.montoConfirmado : s.montoEstimado), 0);
        const st = STAGE_STYLES[stage];
        return (
          <div key={stage} className="flex-shrink-0 w-56">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className={cn("text-xs font-semibold uppercase tracking-wider", st.header)}>{stage}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{items.length}</span>
            </div>
            {total > 0 && <p className="text-xs text-slate-400 dark:text-slate-600 mb-2 px-1">{formatCurrency(total)}</p>}
            <div className="space-y-2 min-h-24">
              {items.map((s) => (
                <div key={s.id}
                  className={cn("rounded-lg border p-3 group cursor-pointer transition-all", st.border)}
                  onClick={() => onEdit(s)}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-slate-700 dark:text-slate-200 text-xs font-medium leading-tight flex-1">{s.empresa}</p>
                    <Button size="sm" variant="ghost"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-900 dark:hover:text-white flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); onEdit(s); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                  <Badge variant="outline" className={cn("text-xs mt-1.5 px-1.5 py-0", CAT_COLORS[s.categoria])}>{s.categoria}</Badge>
                  {s.montoEstimado > 0 && <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5">{formatCurrency(s.montoEstimado)}</p>}
                  {s.proximaAccion && <p className="text-slate-400 dark:text-slate-600 text-xs mt-1 leading-tight truncate">{s.proximaAccion}</p>}
                </div>
              ))}
              {items.length === 0 && (
                <div className={cn("rounded-lg border border-dashed p-4 text-center", st.empty)}>
                  <p className="text-slate-400 dark:text-slate-600 text-xs">Sin sponsors</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
