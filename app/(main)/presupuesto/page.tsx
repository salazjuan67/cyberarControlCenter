"use client";

import { useState } from "react";
import { Plus, Wallet, TrendingDown, AlertTriangle, CheckCircle2, Search, Filter } from "lucide-react";
import { useStore } from "@/store/useStore";
import { calcTotalPresupuestado, calcTotalGastosReal, calcDesvioPorcentual, getActiveMonedas } from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { Moneda } from "@/types";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KPICard } from "@/components/dashboard/KPICard";
import { GastoTable } from "@/components/presupuesto/GastoTable";
import { GastoDialog } from "@/components/presupuesto/GastoDialog";
import { GastoChart } from "@/components/presupuesto/GastoChart";
import type { Gasto, GastoCategoria, GastoEstado } from "@/types";
import { cn } from "@/lib/utils";

const EMPTY_BASE: Omit<Gasto, "id" | "moneda"> = { concepto: "", categoria: "Otros", presupuestoEstimado: 0, costoReal: 0, estado: "Pendiente", proveedor: "", fechaPago: "", notas: "" };

export default function PresupuestoPage() {
  const { gastos, config, addGasto, updateGasto, deleteGasto } = useStore();
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<GastoCategoria | "Todas">("Todas");
  const [filterEstado, setFilterEstado] = useState<GastoEstado | "Todos">("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);

  const activeMonedas = getActiveMonedas([], [], gastos);

  function formatByMoneda(calc: (m: Moneda) => number): string {
    if (activeMonedas.length === 0) return formatCurrency(0, config.moneda);
    return activeMonedas.map((m) => formatCurrency(calc(m), m)).join(" · ");
  }

  function emptyGasto(): Omit<Gasto, "id"> {
    return { ...EMPTY_BASE, moneda: config.moneda };
  }

  const primaryMoneda = activeMonedas[0] ?? config.moneda;
  const desvio = calcDesvioPorcentual(gastos, primaryMoneda);
  const totalPresupuestado = calcTotalPresupuestado(gastos, primaryMoneda);
  const totalReal = calcTotalGastosReal(gastos, primaryMoneda);
  const gastosConfirmados = gastos
    .filter((g) => g.moneda === primaryMoneda && (g.estado === "Confirmado" || g.estado === "Pagado"))
    .reduce((a, g) => a + (g.costoReal || g.presupuestoEstimado), 0);

  const filtered = gastos.filter((g) => {
    const matchSearch = !search || g.concepto.toLowerCase().includes(search.toLowerCase()) || g.proveedor.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filterCategoria === "Todas" || g.categoria === filterCategoria) && (filterEstado === "Todos" || g.estado === filterEstado);
  });

  function handleSave(data: Omit<Gasto, "id">) {
    editingGasto ? updateGasto(editingGasto.id, data) : addGasto({ ...data, id: `g${Date.now()}` });
    setDialogOpen(false); setEditingGasto(null);
  }

  const selectCls = "h-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm";
  const selectContentCls = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
  const selectItemCls = "text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700";

  return (
    <div className="flex flex-col flex-1">
      <Header title="Presupuesto y Gastos" subtitle={`${gastos.length} conceptos — Desvío: ${desvio > 0 ? "+" : ""}${formatPercent(desvio, 1)}`} badge="Control de costos" />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <KPICard title="Total Presupuestado" value={formatByMoneda((m) => calcTotalPresupuestado(gastos, m))} subtitle="Suma de estimaciones" icon={Wallet} accent="cyan" />
          <KPICard title="Total Real" value={formatByMoneda((m) => calcTotalGastosReal(gastos, m))} subtitle="Costos confirmados/pagados" icon={TrendingDown} accent="emerald" />
          <KPICard title="Confirmado + Pagado" value={formatByMoneda((m) => gastos.filter((g) => g.moneda === m && (g.estado === "Confirmado" || g.estado === "Pagado")).reduce((a, g) => a + (g.costoReal || g.presupuestoEstimado), 0))} subtitle="Comprometido firmemente" icon={CheckCircle2} accent="blue" />
          <div className={cn("rounded-xl border p-5 flex flex-col gap-3 bg-white dark:bg-slate-900",
            Math.abs(desvio) <= 10 ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5" : "border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5"
          )}>
            <div className="flex items-start justify-between">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Desvío Presupuestario</p>
              <AlertTriangle className={cn("w-4 h-4", Math.abs(desvio) <= 10 ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400")} />
            </div>
            <p className={cn("text-2xl font-bold", desvio <= 0 ? "text-emerald-600 dark:text-emerald-400" : desvio <= 10 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400")}>
              {desvio > 0 ? "+" : ""}{formatPercent(desvio, 1)}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-xs">{totalReal > 0 ? `${formatCurrency(Math.abs(totalReal - totalPresupuestado), primaryMoneda)} de diferencia (${primaryMoneda})` : "Sin costos reales cargados"}</p>
          </div>
        </div>

        <GastoChart gastos={gastos} />

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input placeholder="Buscar concepto..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 h-8 text-sm" />
          </div>
          <Select value={filterCategoria} onValueChange={(v) => setFilterCategoria(v as GastoCategoria | "Todas")}>
            <SelectTrigger className={`w-44 ${selectCls}`}><Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" /><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentCls}>
              {["Todas","Técnica","Streaming","Catering","Marketing","Diseño","Merchandising","Personal","Infraestructura","Otros"].map((c) => <SelectItem key={c} value={c} className={selectItemCls}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterEstado} onValueChange={(v) => setFilterEstado(v as GastoEstado | "Todos")}>
            <SelectTrigger className={`w-32 ${selectCls}`}><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentCls}>
              {["Todos","Pendiente","Confirmado","Pagado"].map((e) => <SelectItem key={e} value={e} className={selectItemCls}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingGasto(null); setDialogOpen(true); }} size="sm"
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold h-8 gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo Gasto</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>

        <GastoTable gastos={filtered} onEdit={(g) => { setEditingGasto(g); setDialogOpen(true); }} onDelete={deleteGasto} />
      </div>
      <GastoDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editingGasto || undefined} defaultValues={emptyGasto()} onSave={handleSave} />
    </div>
  );
}
