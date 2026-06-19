"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Sponsor, SponsorCategoria, SponsorEstado } from "@/types";

const inputCls = "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500";
const selectContentCls = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
const selectItemCls = "text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700";

interface SponsorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Sponsor;
  defaultValues: Omit<Sponsor, "id">;
  onSave: (data: Omit<Sponsor, "id">) => void;
}

export function SponsorDialog({ open, onOpenChange, initial, defaultValues, onSave }: SponsorDialogProps) {
  const [form, setForm] = useState<Omit<Sponsor, "id">>(initial ? { ...initial } : { ...defaultValues });

  useEffect(() => { setForm(initial ? { ...initial } : { ...defaultValues }); }, [initial, open]);

  function set(field: keyof Omit<Sponsor, "id">, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">{initial ? "Editar Sponsor" : "Nuevo Sponsor"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Empresa *</label>
            <Input value={form.empresa} onChange={(e) => set("empresa", e.target.value)} placeholder="Nombre de la empresa" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Contacto</label>
            <Input value={form.contacto} onChange={(e) => set("contacto", e.target.value)} placeholder="Nombre del contacto" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Email</label>
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@empresa.com" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Teléfono</label>
            <Input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Responsable</label>
            <Input value={form.responsable} onChange={(e) => set("responsable", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Categoría</label>
            <Select value={form.categoria} onValueChange={(v) => set("categoria", v as SponsorCategoria)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                {["Platino","Oro","Plata","Bronce","Institucional"].map((c) => <SelectItem key={c} value={c} className={selectItemCls}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Estado</label>
            <Select value={form.estado} onValueChange={(v) => set("estado", v as SponsorEstado)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                {["Lead","Contactado","Propuesta enviada","En negociación","Confirmado","Perdido"].map((e) => <SelectItem key={e} value={e} className={selectItemCls}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Monto Estimado (USD)</label>
            <Input type="number" value={form.montoEstimado} onChange={(e) => set("montoEstimado", +e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Monto Confirmado (USD)</label>
            <Input type="number" value={form.montoConfirmado} onChange={(e) => set("montoConfirmado", +e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Probabilidad: {form.probabilidad}%</label>
            <input type="range" min={0} max={100} step={5} value={form.probabilidad}
              onChange={(e) => set("probabilidad", +e.target.value)} className="w-full accent-cyan-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Último Contacto</label>
            <Input type="date" value={form.ultimoContacto} onChange={(e) => set("ultimoContacto", e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Próxima Acción</label>
            <Input value={form.proximaAccion} onChange={(e) => set("proximaAccion", e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Notas</label>
            <Textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}
            className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-transparent">Cancelar</Button>
          <Button onClick={() => onSave(form)} disabled={!form.empresa}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">
            {initial ? "Guardar cambios" : "Agregar sponsor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
