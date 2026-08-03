"use client";

import { useMemo, useState } from "react";
import { Plus, Search, UserPlus, Users, Mail } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KPICard } from "@/components/dashboard/KPICard";
import { AsistenteTable } from "@/components/asistentes/AsistenteTable";
import { AsistenteDialog } from "@/components/asistentes/AsistenteDialog";
import { AttendeeEmailPanel } from "@/components/asistentes/AttendeeEmailPanel";
import {
  DEFAULT_ASISTENTE_FILTERS,
  filterAsistentes,
  type AsistenteFilters,
} from "@/lib/asistentes/filters";
import type { AsistentePotencial, AsistenteEstado } from "@/types/asistentes";

const EMPTY: Omit<AsistentePotencial, "id"> = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  organizacion: "",
  cargo: "",
  categoria: "Profesional",
  modalidad: "",
  estado: "Lead",
  origen: "",
  pais: "",
  region: "",
  responsable: "",
  probabilidad: 50,
  ultimoContacto: new Date().toISOString().split("T")[0],
  proximaAccion: "",
  notas: "",
};

export default function AsistentesPotencialesPage() {
  const { asistentesPotenciales, addAsistentePotencial, updateAsistentePotencial, deleteAsistentePotencial } = useStore();
  const [filters, setFilters] = useState<AsistenteFilters>(DEFAULT_ASISTENTE_FILTERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AsistentePotencial | null>(null);
  const [view, setView] = useState<"lista" | "comunicaciones">("lista");

  const filtered = useMemo(() => filterAsistentes(asistentesPotenciales, filters), [asistentesPotenciales, filters]);
  const conEmail = asistentesPotenciales.filter((a) => a.email.trim()).length;
  const inscriptos = asistentesPotenciales.filter((a) => a.estado === "Inscripto").length;
  const enPipeline = asistentesPotenciales.filter((a) =>
    ["Lead", "Contactado", "Invitación enviada", "Interesado"].includes(a.estado)
  ).length;

  async function handleSave(data: Omit<AsistentePotencial, "id">) {
    if (editing) await updateAsistentePotencial(editing.id, data);
    else await addAsistentePotencial({ ...data, id: `ap${Date.now()}` });
    setDialogOpen(false);
    setEditing(null);
  }

  const selectCls = "h-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm";

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Asistentes potenciales"
        subtitle={`${asistentesPotenciales.length} contactos · ${conEmail} con email`}
        badge="Conversión"
        actions={
          <div className="hidden sm:flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            {(["lista", "comunicaciones"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs capitalize ${
                  view === v ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white" : "bg-white dark:bg-slate-900 text-slate-500"
                }`}
              >
                {v === "lista" ? "Lista" : "Comunicaciones"}
              </button>
            ))}
          </div>
        }
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-6xl">
        {view === "lista" ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard title="Total contactos" value={String(asistentesPotenciales.length)} icon={Users} accent="cyan" />
              <KPICard title="Con email" value={String(conEmail)} icon={Mail} accent="purple" />
              <KPICard title="En pipeline" value={String(enPipeline)} subtitle="Lead → Interesado" icon={UserPlus} accent="yellow" />
              <KPICard title="Inscriptos" value={String(inscriptos)} icon={UserPlus} accent="emerald" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-40">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Buscar nombre, email, organización..."
                  value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                  className="pl-9 h-8 text-sm"
                />
              </div>
              <Select value={filters.estado} onValueChange={(v) => v && setFilters((p) => ({ ...p, estado: v as AsistenteEstado | "Todos" }))}>
                <SelectTrigger className={`w-44 ${selectCls}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Todos","Lead","Contactado","Invitación enviada","Interesado","Inscripto","No interesado"].map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }} size="sm" className="bg-violet-600 hover:bg-violet-500 text-white font-semibold h-8 gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Nuevo contacto
              </Button>
            </div>

            <p className="text-xs text-slate-500">{filtered.length} resultado(s)</p>
            <AsistenteTable asistentes={filtered} onEdit={(a) => { setEditing(a); setDialogOpen(true); }} onDelete={deleteAsistentePotencial} />
          </>
        ) : (
          <AttendeeEmailPanel />
        )}
      </div>

      <AsistenteDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing ?? undefined} defaultValues={EMPTY} onSave={handleSave} />
    </div>
  );
}
