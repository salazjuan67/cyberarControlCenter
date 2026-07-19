"use client";

import { useState, useEffect } from "react";
import { Save, RotateCcw, Settings, Shield, Trash2, TriangleAlert } from "lucide-react";
import { useStore } from "@/store/useStore";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EventConfig, Moneda } from "@/types";

const inputCls = "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200";
const selectContentCls = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
const selectItemCls = "text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700";

export default function ConfiguracionPage() {
  const { config, setConfig, resetToDefaults, clearAllData } = useStore();
  const [form, setForm] = useState<EventConfig>({ ...config });
  const [saved, setSaved] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearDone, setClearDone] = useState(false);

  const [clearing, setClearing] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setForm({ ...config });
  }, [config]);

  function handleSave() { setConfig(form); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  function set(field: keyof EventConfig, value: string | number) { setForm((p) => ({ ...p, [field]: value })); }

  async function handleClearAll() {
    setClearing(true);
    await clearAllData();
    setClearing(false);
    setShowClearDialog(false);
    setClearDone(true);
    setTimeout(() => setClearDone(false), 3000);
  }

  async function handleReset() {
    setResetting(true);
    await resetToDefaults();
    setResetting(false);
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Configuración" subtitle="Parámetros generales del evento" badge="Sistema" />
      <div className="p-4 md:p-6 max-w-2xl space-y-4 md:space-y-6">

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm">Información del Evento</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Nombre del Evento</label>
              <Input value={form.nombreEvento} onChange={(e) => set("nombreEvento", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Año</label>
              <Input type="number" value={form.anio} onChange={(e) => set("anio", +e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Moneda por defecto</label>
              <Select value={form.moneda} onValueChange={(v) => v && set("moneda", v as Moneda)}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent className={selectContentCls}>
                  {["USD","ARS","EUR"].map((c) => <SelectItem key={c} value={c} className={selectItemCls}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Fecha de Inicio</label>
              <Input type="date" value={form.fechaInicio} onChange={(e) => set("fechaInicio", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Cierre de Inscripciones</label>
              <Input type="date" value={form.fechaCierreInscripciones} onChange={(e) => set("fechaCierreInscripciones", e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-5">
            <Settings className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm">Metas y Objetivos</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Meta Inscriptos Presenciales</label>
              <Input type="number" value={form.metaPresencial} onChange={(e) => set("metaPresencial", +e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Meta Inscriptos Virtuales</label>
              <Input type="number" value={form.metaVirtual} onChange={(e) => set("metaVirtual", +e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Meta de Sponsors</label>
              <Input type="number" value={form.metaSponsors} onChange={(e) => set("metaSponsors", +e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Break Even</label>
              <Input type="number" value={form.breakEven} onChange={(e) => set("breakEven", +e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Moneda Break Even</label>
              <Select value={form.breakEvenMoneda} onValueChange={(v) => v && set("breakEvenMoneda", v as Moneda)}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent className={selectContentCls}>
                  {["USD","ARS","EUR"].map((c) => <SelectItem key={c} value={c} className={selectItemCls}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5">
          <h3 className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-3">Configuración actual guardada</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: "Evento", value: config.nombreEvento },
              { label: "Año", value: String(config.anio) },
              { label: "Moneda", value: config.moneda },
              { label: "Break Even", value: formatCurrency(config.breakEven, config.breakEvenMoneda) },
              { label: "Inicio", value: formatDate(config.fechaInicio) },
              { label: "Cierre inscr.", value: formatDate(config.fechaCierreInscripciones) },
              { label: "Meta presencial", value: String(config.metaPresencial) + " asist." },
              { label: "Meta virtual", value: String(config.metaVirtual) + " asist." },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500">{item.label}</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold gap-2">
            <Save className="w-4 h-4" />{saved ? "¡Guardado!" : "Guardar configuración"}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={resetting}
            className="border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent gap-2">
            <RotateCcw className="w-4 h-4" />{resetting ? "Restaurando..." : "Restaurar datos demo"}
          </Button>
        </div>

        {/* Danger zone */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-500/20 p-5">
          <div className="flex items-center gap-2 mb-1">
            <TriangleAlert className="w-4 h-4 text-red-500 dark:text-red-400" />
            <h3 className="text-red-600 dark:text-red-400 font-semibold text-sm">Zona de peligro</h3>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            Las siguientes acciones son irreversibles. Actuá con precaución.
          </p>
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/15">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Borrar todos los datos</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Elimina sponsors, inscripciones y gastos. La configuración del evento se mantiene.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(true)}
              className="ml-4 shrink-0 border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-400 dark:hover:border-red-500/50 bg-transparent gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {clearDone ? "¡Datos borrados!" : "Borrar datos"}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 shrink-0">
                <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <DialogTitle className="text-slate-800 dark:text-white text-base">
                ¿Borrar todos los datos?
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Esta acción eliminará permanentemente todos los{" "}
              <strong className="text-slate-700 dark:text-slate-300">sponsors</strong>,{" "}
              <strong className="text-slate-700 dark:text-slate-300">inscripciones</strong> y{" "}
              <strong className="text-slate-700 dark:text-slate-300">gastos</strong> cargados.
              <br /><br />
              La configuración del evento no se verá afectada. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleClearAll}
              disabled={clearing}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {clearing ? "Borrando..." : "Sí, borrar todo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
