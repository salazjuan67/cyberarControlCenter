"use client";

import { useState } from "react";
import { Plus, Users, Monitor, DollarSign, TrendingUp } from "lucide-react";
import { useStore } from "@/store/useStore";
import { calcTotalInscripcionesConfirmado, calcTotalInscripcionesProyectado, calcAsistentesPresenciales, calcAsistentesVirtuales } from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/dashboard/KPICard";
import { InscripcionTable } from "@/components/inscripciones/InscripcionTable";
import { InscripcionDialog } from "@/components/inscripciones/InscripcionDialog";
import { InscripcionCharts } from "@/components/inscripciones/InscripcionCharts";
import { InscripcionSimulator } from "@/components/inscripciones/InscripcionSimulator";
import type { Inscripcion } from "@/types";

const EMPTY: Omit<Inscripcion, "id"> = { categoria: "Profesional", modalidad: "Presencial", precioUnitario: 100, cantidadConfirmada: 0, cantidadProyectada: 0 };

export default function InscripcionesPage() {
  const { inscripciones, config, addInscripcion, updateInscripcion, deleteInscripcion } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Inscripcion | null>(null);

  const totalConf = calcTotalInscripcionesConfirmado(inscripciones);
  const totalProy = calcTotalInscripcionesProyectado(inscripciones);
  const presConf = calcAsistentesPresenciales(inscripciones);
  const virtConf = calcAsistentesVirtuales(inscripciones);

  function handleSave(data: Omit<Inscripcion, "id">) {
    editing ? updateInscripcion(editing.id, data) : addInscripcion({ ...data, id: `i${Date.now()}` });
    setDialogOpen(false); setEditing(null);
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Inscripciones" subtitle={`${presConf + virtConf} inscriptos confirmados`} badge="Gestión de asistentes" />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <KPICard title="Ingresos Confirmados" value={formatCurrency(totalConf)} subtitle="Inscripciones pagadas" icon={DollarSign} accent="emerald" />
          <KPICard title="Ingresos Proyectados" value={formatCurrency(totalProy)} subtitle="Según metas" icon={TrendingUp} accent="cyan" />
          <KPICard title="Presencial" value={formatNumber(presConf)} subtitle={`Meta: ${formatNumber(config.metaPresencial)}`} icon={Users} accent="blue"
            trend={presConf >= config.metaPresencial * 0.7 ? "up" : "neutral"}
            trendLabel={`${((presConf / config.metaPresencial) * 100).toFixed(0)}% de meta`} />
          <KPICard title="Virtual" value={formatNumber(virtConf)} subtitle={`Meta: ${formatNumber(config.metaVirtual)}`} icon={Monitor} accent="purple"
            trend={virtConf >= config.metaVirtual * 0.5 ? "up" : "neutral"}
            trendLabel={`${((virtConf / config.metaVirtual) * 100).toFixed(0)}% de meta`} />
        </div>

        <InscripcionCharts inscripciones={inscripciones} />
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
      <InscripcionDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing || undefined} defaultValues={EMPTY} onSave={handleSave} />
    </div>
  );
}
