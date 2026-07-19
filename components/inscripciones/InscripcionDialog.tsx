"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Inscripcion, InscripcionCategoria, InscripcionModalidad } from "@/types";
import { MonedaSelect } from "@/components/shared/MonedaSelect";

const inputCls = "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200";
const selectContentCls = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
const selectItemCls = "text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700";

const CATEGORIAS: InscripcionCategoria[] = ["Profesional","Estudiante","Militar","Investigador","Invitado","Expositor"];
const MODALIDADES: InscripcionModalidad[] = ["Presencial","Virtual"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Inscripcion;
  defaultValues: Omit<Inscripcion, "id">;
  onSave: (data: Omit<Inscripcion, "id">) => void;
}

export function InscripcionDialog({ open, onOpenChange, initial, defaultValues, onSave }: Props) {
  const [form, setForm] = useState<Omit<Inscripcion, "id">>(initial ? { ...initial } : { ...defaultValues });
  useEffect(() => { setForm(initial ? { ...initial } : { ...defaultValues }); }, [initial, open]);
  function set(field: keyof Omit<Inscripcion, "id">, value: string | number) { setForm((p) => ({ ...p, [field]: value })); }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">{initial ? "Editar Inscripción" : "Nueva Categoría"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Categoría</label>
            <Select value={form.categoria} onValueChange={(v) => set("categoria", v as InscripcionCategoria)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                {CATEGORIAS.map((c) => <SelectItem key={c} value={c} className={selectItemCls}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Modalidad</label>
            <Select value={form.modalidad} onValueChange={(v) => set("modalidad", v as InscripcionModalidad)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                {MODALIDADES.map((m) => <SelectItem key={m} value={m} className={selectItemCls}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Moneda</label>
            <MonedaSelect
              value={form.moneda}
              onChange={(v) => set("moneda", v)}
              className={inputCls}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Precio Unitario</label>
            <Input type="number" value={form.precioUnitario} onChange={(e) => set("precioUnitario", +e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Cantidad Confirmada</label>
            <Input type="number" value={form.cantidadConfirmada} onChange={(e) => set("cantidadConfirmada", +e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Cantidad Proyectada</label>
            <Input type="number" value={form.cantidadProyectada} onChange={(e) => set("cantidadProyectada", +e.target.value)} className={inputCls} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}
            className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-transparent">Cancelar</Button>
          <Button onClick={() => onSave(form)} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">
            {initial ? "Guardar cambios" : "Agregar categoría"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
