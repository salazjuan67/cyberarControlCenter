"use client";

import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Sponsor } from "@/types";
import {
  countActiveFilters,
  DEFAULT_SPONSOR_FILTERS,
  getUniquePrioridades,
  getUniqueRegiones,
  getUniqueResponsables,
  getUniqueSegmentos,
  type SponsorFilters,
} from "@/lib/sponsors/filters";

const selectCls =
  "h-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm";
const selectContentCls = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
const selectItemCls =
  "text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700";

interface SponsorFiltersBarProps {
  sponsors: Sponsor[];
  filters: SponsorFilters;
  onChange: (filters: SponsorFilters) => void;
  resultCount: number;
}

export function SponsorFiltersBar({
  sponsors,
  filters,
  onChange,
  resultCount,
}: SponsorFiltersBarProps) {
  const segmentos = getUniqueSegmentos(sponsors);
  const prioridades = getUniquePrioridades(sponsors);
  const regiones = getUniqueRegiones(sponsors);
  const responsables = getUniqueResponsables(sponsors);
  const activeCount = countActiveFilters(filters);

  function set<K extends keyof SponsorFilters>(key: K, value: SponsorFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Segmentación
          {activeCount > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {activeCount}
            </Badge>
          )}
        </div>

        <Select value={filters.prioridad} onValueChange={(v) => v && set("prioridad", v)}>
          <SelectTrigger className={`w-40 ${selectCls}`}>
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            <SelectItem value="Todos" className={selectItemCls}>
              Todas las prioridades
            </SelectItem>
            {prioridades.map((p) => (
              <SelectItem key={p} value={p} className={selectItemCls}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.region} onValueChange={(v) => v && set("region", v)}>
          <SelectTrigger className={`w-44 ${selectCls}`}>
            <SelectValue placeholder="Región" />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            <SelectItem value="Todos" className={selectItemCls}>
              Todas las regiones
            </SelectItem>
            {regiones.map((r) => (
              <SelectItem key={r} value={r} className={selectItemCls}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.segmento} onValueChange={(v) => v && set("segmento", v)}>
          <SelectTrigger className={`w-52 ${selectCls}`}>
            <SelectValue placeholder="Rubro / segmento" />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            <SelectItem value="Todos" className={selectItemCls}>
              Todos los rubros
            </SelectItem>
            {segmentos.map((s) => (
              <SelectItem key={s} value={s} className={selectItemCls}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.responsable} onValueChange={(v) => v && set("responsable", v)}>
          <SelectTrigger className={`w-36 ${selectCls}`}>
            <SelectValue placeholder="Responsable" />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            <SelectItem value="Todos" className={selectItemCls}>
              Todos
            </SelectItem>
            {responsables.map((r) => (
              <SelectItem key={r} value={r} className={selectItemCls}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.moneda} onValueChange={(v) => v && set("moneda", v as SponsorFilters["moneda"])}>
          <SelectTrigger className={`w-28 ${selectCls}`}>
            <SelectValue placeholder="Moneda" />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            {["Todas", "ARS", "USD", "EUR"].map((m) => (
              <SelectItem key={m} value={m} className={selectItemCls}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.probabilidad}
          onValueChange={(v) => v && set("probabilidad", v as SponsorFilters["probabilidad"])}
        >
          <SelectTrigger className={`w-32 ${selectCls}`}>
            <SelectValue placeholder="Puntaje" />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            {[
              ["Todos", "Todos"],
              ["Alta", "Alta (≥75)"],
              ["Media", "Media (40-74)"],
              ["Baja", "Baja (<40)"],
            ].map(([value, label]) => (
              <SelectItem key={value} value={value} className={selectItemCls}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.email} onValueChange={(v) => v && set("email", v as SponsorFilters["email"])}>
          <SelectTrigger className={`w-32 ${selectCls}`}>
            <SelectValue placeholder="Email" />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            {["Todos", "Con email", "Sin email"].map((e) => (
              <SelectItem key={e} value={e} className={selectItemCls}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...DEFAULT_SPONSOR_FILTERS, search: filters.search })}
            className="h-8 gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {prioridades.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">Prioridad:</span>
          {prioridades.map((prioridad) => (
            <button
              key={prioridad}
              type="button"
              onClick={() =>
                set("prioridad", filters.prioridad === prioridad ? "Todos" : prioridad)
              }
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filters.prioridad === prioridad
                  ? "bg-cyan-50 dark:bg-cyan-500/15 border-cyan-300 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-cyan-300 dark:hover:border-cyan-500/30"
              }`}
            >
              {prioridad}
            </button>
          ))}
        </div>
      )}

      {regiones.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">Región:</span>
          {regiones.map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => set("region", filters.region === region ? "Todos" : region)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filters.region === region
                  ? "bg-purple-50 dark:bg-purple-500/15 border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-300"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-500/30"
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Mostrando {resultCount} de {sponsors.length} sponsors
      </p>
    </div>
  );
}
