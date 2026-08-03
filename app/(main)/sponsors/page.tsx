"use client";

import { useMemo, useState } from "react";
import { Plus, Building2, DollarSign, TrendingUp, Filter, Search, Upload } from "lucide-react";
import { useStore } from "@/store/useStore";
import { calcSponsorsConfirmados, calcSponsorsPotencial, calcSponsorsPonderado, getActiveMonedas } from "@/lib/calculations";
import { formatCurrency, formatTotalsByMoneda, sumByMoneda } from "@/lib/formatters";
import {
  DEFAULT_SPONSOR_FILTERS,
  filterSponsors,
  type SponsorFilters,
} from "@/lib/sponsors/filters";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KPICard } from "@/components/dashboard/KPICard";
import { SponsorTable } from "@/components/sponsors/SponsorTable";
import { SponsorDialog } from "@/components/sponsors/SponsorDialog";
import { SponsorPipeline } from "@/components/sponsors/SponsorPipeline";
import { SponsorImportDialog } from "@/components/sponsors/SponsorImportDialog";
import { SponsorFiltersBar } from "@/components/sponsors/SponsorFiltersBar";
import type { Sponsor, SponsorCategoria, SponsorEstado, Moneda } from "@/types";

const EMPTY_BASE: Omit<Sponsor, "id" | "moneda"> = {
  empresa: "", contacto: "", email: "", telefono: "", categoria: "Plata", estado: "Lead",
  montoEstimado: 0, montoConfirmado: 0, probabilidad: 50, responsable: "", segmento: "",
  prioridad: "", region: "",
  ultimoContacto: new Date().toISOString().split("T")[0], proximaAccion: "", notas: "",
};

export default function SponsorsPage() {
  const { sponsors, addSponsor, updateSponsor, deleteSponsor, config } = useStore();
  const [filters, setFilters] = useState<SponsorFilters>(DEFAULT_SPONSOR_FILTERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [view, setView] = useState<"tabla" | "pipeline">("tabla");

  const activeMonedas = getActiveMonedas(sponsors, [], []);
  const confirmadoByMoneda = sumByMoneda(
    sponsors.filter((s) => s.estado === "Confirmado"),
    (s) => s.montoConfirmado
  );
  const potencialByMoneda = sumByMoneda(
    sponsors.filter((s) => s.estado !== "Perdido" && s.estado !== "Confirmado"),
    (s) => s.montoEstimado
  );

  const defaultSponsorValues = useMemo(
    () => ({ ...EMPTY_BASE, moneda: config.moneda }),
    [config.moneda]
  );

  function formatKpiByMoneda(calc: (moneda: Moneda) => number): string {
    if (activeMonedas.length === 0) return formatCurrency(0, config.moneda);
    return activeMonedas.map((m) => formatCurrency(calc(m), m)).join(" · ");
  }

  const confirmados = sponsors.filter((s) => s.estado === "Confirmado").length;
  const filtered = useMemo(() => filterSponsors(sponsors, filters), [sponsors, filters]);

  async function handleSave(data: Omit<Sponsor, "id">) {
    if (editingSponsor) {
      await updateSponsor(editingSponsor.id, data);
    } else {
      await addSponsor({ ...data, id: `s${Date.now()}` });
    }
    setDialogOpen(false);
    setEditingSponsor(null);
  }

  const selectCls = "h-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm";
  const selectContentCls = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
  const selectItemCls = "text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700";

  return (
    <div className="flex flex-col flex-1">
      <Header title="Sponsors & Auspiciantes" subtitle={`${sponsors.length} sponsors — ${confirmados} confirmados`} badge="CRM"
        actions={
          <div className="hidden sm:flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            {(["tabla", "pipeline"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs capitalize transition-colors ${view === v ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}>
                {v === "tabla" ? "Tabla" : "Pipeline"}
              </button>
            ))}
          </div>
        }
      />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <KPICard title="Total Confirmado" value={formatTotalsByMoneda(confirmadoByMoneda) || formatCurrency(0, config.moneda)} subtitle={`${confirmados} sponsors activos`} icon={DollarSign} accent="emerald" />
          <KPICard title="Total Potencial" value={formatTotalsByMoneda(potencialByMoneda) || formatCurrency(0, config.moneda)} subtitle="Sponsors no confirmados" icon={Building2} accent="yellow" />
          <KPICard title="Total Ponderado" value={formatKpiByMoneda((m) => calcSponsorsPonderado(sponsors, m))} subtitle="Ajustado por probabilidad" icon={TrendingUp} accent="cyan" />
          <KPICard title="Pipeline Total" value={formatKpiByMoneda((m) => calcSponsorsConfirmados(sponsors, m) + calcSponsorsPotencial(sponsors, m))} subtitle="Confirmado + Potencial" icon={Building2} accent="purple" />
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Buscar empresa, contacto, segmento..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="pl-9 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 h-8 text-sm"
            />
          </div>
          <Select
            value={filters.estado}
            onValueChange={(v) => v && setFilters((prev) => ({ ...prev, estado: v as SponsorEstado | "Todos" }))}
          >
            <SelectTrigger className={`w-40 ${selectCls}`}><Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" /><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentCls}>
              {["Todos","Lead","Contactado","Propuesta enviada","En negociación","Confirmado","Perdido"].map((e) => <SelectItem key={e} value={e} className={selectItemCls}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filters.categoria}
            onValueChange={(v) => v && setFilters((prev) => ({ ...prev, categoria: v as SponsorCategoria | "Todas" }))}
          >
            <SelectTrigger className={`w-36 ${selectCls}`}><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentCls}>
              {["Todas","Platino","Oro","Plata","Bronce","Institucional"].map((c) => <SelectItem key={c} value={c} className={selectItemCls}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setImportOpen(true)}
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-slate-300 dark:border-slate-700"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Importar Excel</span>
            <span className="sm:hidden">Importar</span>
          </Button>
          <Button onClick={() => { setEditingSponsor(null); setDialogOpen(true); }} size="sm"
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold h-8 gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo Sponsor</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>

        <SponsorFiltersBar
          sponsors={sponsors}
          filters={filters}
          onChange={setFilters}
          resultCount={filtered.length}
        />

        {view === "tabla"
          ? <SponsorTable sponsors={filtered} onEdit={(s) => { setEditingSponsor(s); setDialogOpen(true); }} onDelete={deleteSponsor} />
          : <SponsorPipeline sponsors={filtered} onEdit={(s) => { setEditingSponsor(s); setDialogOpen(true); }} />
        }
      </div>
      <SponsorDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editingSponsor || undefined} defaultValues={defaultSponsorValues} onSave={handleSave} />
      <SponsorImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
