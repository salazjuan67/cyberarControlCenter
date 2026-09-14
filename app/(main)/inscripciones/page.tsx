"use client";

import { useState, useMemo } from "react";
import { Plus, Users, Monitor, DollarSign, TrendingUp } from "lucide-react";
import { useStore } from "@/store/useStore";
import { calcTotalInscripcionesConfirmado, calcTotalInscripcionesProyectado, calcAsistentesPresenciales, calcAsistentesVirtuales, getActiveMonedas } from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { Moneda } from "@/types";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/dashboard/KPICard";
import { CyberarFinancePanel } from "@/components/dashboard/CyberarFinancePanel";
import { InscripcionTable } from "@/components/inscripciones/InscripcionTable";
import { InscripcionDialog } from "@/components/inscripciones/InscripcionDialog";
import { InscripcionCharts } from "@/components/inscripciones/InscripcionCharts";
import { InscripcionSimulator } from "@/components/inscripciones/InscripcionSimulator";
import { mergeInvitedParticipants } from "@/lib/finance-summary-merge";
import type { Inscripcion } from "@/types";

const EMPTY_BASE: Omit<Inscripcion, "id" | "moneda"> = { categoria: "Profesional", modalidad: "Presencial", precioUnitario: 0, cantidadConfirmada: 0, cantidadProyectada: 0 };

export default function InscripcionesPage() {
  const {
    inscripciones,
    asistentesPotenciales,
    config,
    addInscripcion,
    updateInscripcion,
    deleteInscripcion,
    financeSummary,
    financeSummaryLoading,
    financeSummaryError,
    financeSummaryConfigured,
    refreshFinanceSummary,
  } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Inscripcion | null>(null);

  const displayFinanceSummary = useMemo(
    () => mergeInvitedParticipants(financeSummary, asistentesPotenciales),
    [financeSummary, asistentesPotenciales]
  );
  const invitedCount =
    displayFinanceSummary?.participants.by_categoria.invitado ?? 0;
  const activeMonedas = getActiveMonedas([], inscripciones, [], [], displayFinanceSummary);

  function formatByMoneda(calc: (m: Moneda) => number): string {
    if (activeMonedas.length === 0) return formatCurrency(0, config.moneda);
    return activeMonedas.map((m) => formatCurrency(calc(m), m)).join(" · ");
  }

  const defaultInscripcionValues = useMemo(
    () => ({ ...EMPTY_BASE, moneda: config.moneda }),
    [config.moneda]
  );

  const presConf = calcAsistentesPresenciales(inscripciones, "confirmada", undefined, displayFinanceSummary);
  const virtConf = calcAsistentesVirtuales(inscripciones, "confirmada", undefined, displayFinanceSummary);

  async function handleSave(data: Omit<Inscripcion, "id">) {
    if (editing) {
      await updateInscripcion(editing.id, data);
    } else {
      await addInscripcion({ ...data, id: `i${Date.now()}` });
    }
    setDialogOpen(false);
    setEditing(null);
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Inscripciones" subtitle={`${presConf + virtConf} inscriptos confirmados`} badge="Gestión de asistentes" />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <CyberarFinancePanel
          summary={displayFinanceSummary}
          loading={financeSummaryLoading}
          error={financeSummaryError}
          configured={financeSummaryConfigured}
          onRefresh={() => void refreshFinanceSummary()}
          compact
        />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <KPICard title="Ingresos Confirmados" value={formatByMoneda((m) => calcTotalInscripcionesConfirmado(inscripciones, m, displayFinanceSummary))} subtitle="Inscripciones pagadas (CYBER.AR + manual)" icon={DollarSign} accent="emerald" />
          <KPICard title="Ingresos Proyectados" value={formatByMoneda((m) => calcTotalInscripcionesProyectado(inscripciones, m, displayFinanceSummary))} subtitle="Según metas y pagos reales" icon={TrendingUp} accent="cyan" />
          <KPICard title="Presencial" value={formatNumber(presConf)} subtitle={`Meta: ${formatNumber(config.metaPresencial)}`} icon={Users} accent="blue"
            trend={presConf >= config.metaPresencial * 0.7 ? "up" : "neutral"}
            trendLabel={`${((presConf / config.metaPresencial) * 100).toFixed(0)}% de meta`} />
          <KPICard title="Virtual" value={formatNumber(virtConf)} subtitle={`Meta: ${formatNumber(config.metaVirtual)}`} icon={Monitor} accent="purple"
            trend={virtConf >= config.metaVirtual * 0.5 ? "up" : "neutral"}
            trendLabel={`${((virtConf / config.metaVirtual) * 100).toFixed(0)}% de meta`} />
          <KPICard title="Invitados" value={formatNumber(invitedCount)} subtitle="Sin cargo de inscripción" icon={Users} accent="yellow" />
        </div>

        <InscripcionCharts inscripciones={inscripciones} financeSummary={displayFinanceSummary} />
        <InscripcionSimulator inscripciones={inscripciones} />

        <div className="flex items-center justify-between">
          <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm">Tabla de Inscripciones</h3>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} size="sm"
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold h-8 gap-1.5">
            <Plus className="w-3.5 h-3.5" /><span className="hidden sm:inline">Nueva Categoría</span><span className="sm:hidden">Nueva</span>
          </Button>
        </div>
        <InscripcionTable inscripciones={inscripciones} onEdit={(i) => { setEditing(i); setDialogOpen(true); }} onDelete={deleteInscripcion} />
      </div>
      <InscripcionDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing || undefined} defaultValues={defaultInscripcionValues} onSave={handleSave} />
    </div>
  );
}
