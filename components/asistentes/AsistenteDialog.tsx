"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AsistentePotencial, AsistenteCategoria, AsistenteEstado, AsistenteModalidad } from "@/types/asistentes";
import { AsistenteEmailHistory } from "@/components/asistentes/AsistenteEmailHistory";
import { useDialogForm } from "@/lib/useDialogForm";
import {
  paymentStatusLabel,
  registrationStatusClass,
  registrationStatusLabel,
} from "@/lib/asistentes/registration-display";
import { Badge } from "@/components/ui/badge";
import { formatNewsletterDate } from "@/lib/newsletter/display";
import { cn } from "@/lib/utils";

const inputCls = "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200";
const selectContentCls = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
const selectItemCls = "text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700";

interface AsistenteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AsistentePotencial;
  defaultValues: Omit<AsistentePotencial, "id">;
  onSave: (data: Omit<AsistentePotencial, "id">) => void | Promise<void>;
}

export function AsistenteDialog({ open, onOpenChange, initial, defaultValues, onSave }: AsistenteDialogProps) {
  const [form, setForm] = useDialogForm(open, initial, defaultValues);
  const [saving, setSaving] = useState(false);

  function set(field: keyof Omit<AsistentePotencial, "id">, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">
            {initial ? "Editar asistente potencial" : "Nuevo asistente potencial"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          {initial?.registrationStatus && (
            <div className="col-span-2 rounded-lg border border-cyan-200 dark:border-cyan-500/20 bg-cyan-50/60 dark:bg-cyan-500/5 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Sistema de inscripciones
                </span>
                <Badge
                  variant="outline"
                  className={cn("text-xs", registrationStatusClass(initial.registrationStatus))}
                >
                  {registrationStatusLabel(initial.registrationStatus)}
                </Badge>
                <span className="text-xs text-slate-500">
                  {paymentStatusLabel(initial.paymentStatus)}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                {initial.registeredAt
                  ? `Registrado: ${formatNewsletterDate(initial.registeredAt)}`
                  : ""}
                {initial.registrationId ? ` · ID: ${initial.registrationId}` : ""}
              </p>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Nombre *</label>
            <Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Apellido</label>
            <Input value={form.apellido} onChange={(e) => set("apellido", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Email</label>
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Teléfono</label>
            <Input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-500 mb-1.5 block">Organización</label>
            <Input value={form.organizacion} onChange={(e) => set("organizacion", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Cargo</label>
            <Input value={form.cargo} onChange={(e) => set("cargo", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Origen</label>
            <Input value={form.origen} onChange={(e) => set("origen", e.target.value)} placeholder="Web, referido, evento..." className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Categoría</label>
            <Select value={form.categoria} onValueChange={(v) => v && set("categoria", v as AsistenteCategoria)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                {["Profesional","Estudiante","Militar","Investigador","Invitado","Expositor"].map((c) => (
                  <SelectItem key={c} value={c} className={selectItemCls}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Modalidad</label>
            <Select value={form.modalidad || "none"} onValueChange={(v) => set("modalidad", v === "none" ? "" : v as AsistenteModalidad)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                <SelectItem value="none" className={selectItemCls}>Sin definir</SelectItem>
                <SelectItem value="Presencial" className={selectItemCls}>Presencial</SelectItem>
                <SelectItem value="Virtual" className={selectItemCls}>Virtual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Estado</label>
            <Select value={form.estado} onValueChange={(v) => v && set("estado", v as AsistenteEstado)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentCls}>
                {["Lead","Contactado","Invitación enviada","Interesado","Inscripto","No interesado"].map((e) => (
                  <SelectItem key={e} value={e} className={selectItemCls}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Responsable</label>
            <Input value={form.responsable} onChange={(e) => set("responsable", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Probabilidad: {form.probabilidad}%</label>
            <input type="range" min={0} max={100} step={5} value={form.probabilidad}
              onChange={(e) => set("probabilidad", +e.target.value)} className="w-full accent-violet-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Último contacto</label>
            <Input type="date" value={form.ultimoContacto} onChange={(e) => set("ultimoContacto", e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-500 mb-1.5 block">Próxima acción</label>
            <Input value={form.proximaAccion} onChange={(e) => set("proximaAccion", e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-500 mb-1.5 block">Notas</label>
            <Textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </div>
          {initial?.id && <AsistenteEmailHistory attendeeId={initial.id} email={form.email} />}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="border-slate-300 dark:border-slate-700">Cancelar</Button>
          <Button onClick={() => void handleSubmit()} disabled={!form.nombre.trim() || saving} className="bg-violet-600 hover:bg-violet-500 text-white font-semibold">
            {saving ? "Guardando..." : initial ? "Guardar cambios" : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
