"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Gasto, GastoCategoria, GastoEstado } from "@/types";

const inputCls = "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500";
const selectContentCls = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
const selectItemCls = "text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700";

const CATEGORIAS: GastoCategoria[] = ["Técnica","Streaming","Catering","Marketing","Diseño","Merchandising","Personal","Infraestructura","Otros"];
const ESTADOS: GastoEstado[] = ["Pendiente","Confirmado","Pagado"];

interface GastoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Gasto;
  defaultValues: Omit<Gasto, "id">;
  onSave: (data: Omit<Gasto, "id">) => void;
}

export function GastoDialog({ open, onOpenChange, initial, defaultValues, onSave }: GastoDialogProps) {
  const [form, setForm] = useState<Omit<Gasto, "id">>(initial ? { ...initial } : { ...defaultValues });
  useEffect(() => { setForm(initial ? { ...initial } : { ...defaultValues }); }, [initial, open]);
  function set(field: keyof Omit<Gasto, "id">, value: string | number) { setForm((p) => ({ ...p, [field]: value })); }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">{initial ? "Editar Gasto" : "Nuevo Gasto"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Concepto *</label>
            <Input value={form.concepto} onChange={(e) => set("concepto", e.target.value)} placeholder="Descripción del gasto" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Categoría</label>
            <Select value={form.categoria} onValueChange={(v) => set("categoria", v as GastoCategoria)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                {CATEGORIAS.map((c) => <SelectItem key={c} value={c} className={selectItemCls}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Estado</label>
            <Select value={form.estado} onValueChange={(v) => set("estado", v as GastoEstado)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                {ESTADOS.map((e) => <SelectItem key={e} value={e} className={selectItemCls}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Presupuesto Estimado (USD)</label>
            <Input type="number" value={form.presupuestoEstimado} onChange={(e) => set("presupuestoEstimado", +e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Costo Real (USD)</label>
            <Input type="number" value={form.costoReal} onChange={(e) => set("costoReal", +e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Proveedor</label>
            <Input value={form.proveedor} onChange={(e) => set("proveedor", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Fecha Est. de Pago</label>
            <Input type="date" value={form.fechaPago} onChange={(e) => set("fechaPago", e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Notas</label>
            <Textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}
            className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-transparent">Cancelar</Button>
          <Button onClick={() => onSave(form)} disabled={!form.concepto}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">
            {initial ? "Guardar cambios" : "Agregar gasto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
