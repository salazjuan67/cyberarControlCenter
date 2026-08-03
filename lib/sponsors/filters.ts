import type {
  Moneda,
  Sponsor,
  SponsorCategoria,
  SponsorEstado,
} from "@/types";
import { sponsorKey } from "@/lib/sponsors/import";

export type ProbabilidadRango = "Todos" | "Alta" | "Media" | "Baja";
export type EmailFilter = "Todos" | "Con email" | "Sin email";

export interface SponsorFilters {
  search: string;
  estado: SponsorEstado | "Todos";
  categoria: SponsorCategoria | "Todas";
  segmento: string;
  prioridad: string;
  region: string;
  responsable: string;
  moneda: Moneda | "Todas";
  probabilidad: ProbabilidadRango;
  email: EmailFilter;
}

export const DEFAULT_SPONSOR_FILTERS: SponsorFilters = {
  search: "",
  estado: "Todos",
  categoria: "Todas",
  segmento: "Todos",
  prioridad: "Todos",
  region: "Todos",
  responsable: "Todos",
  moneda: "Todas",
  probabilidad: "Todos",
  email: "Todos",
};

function matchesProbabilidad(probabilidad: number, rango: ProbabilidadRango): boolean {
  if (rango === "Todos") return true;
  if (rango === "Alta") return probabilidad >= 75;
  if (rango === "Media") return probabilidad >= 40 && probabilidad < 75;
  return probabilidad < 40;
}

export function filterSponsors(sponsors: Sponsor[], filters: SponsorFilters): Sponsor[] {
  const search = filters.search.trim().toLowerCase();

  return sponsors.filter((s) => {
    if (search) {
      const haystack = [
        s.empresa,
        s.contacto,
        s.email,
        s.responsable,
        s.segmento,
        s.prioridad,
        s.region,
        s.notas,
        s.proximaAccion,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (filters.estado !== "Todos" && s.estado !== filters.estado) return false;
    if (filters.categoria !== "Todas" && s.categoria !== filters.categoria) return false;
    if (filters.segmento !== "Todos" && s.segmento !== filters.segmento) return false;
    if (filters.prioridad !== "Todos" && s.prioridad !== filters.prioridad) return false;
    if (filters.region !== "Todos" && s.region !== filters.region) return false;
    if (filters.responsable !== "Todos" && s.responsable !== filters.responsable) return false;
    if (filters.moneda !== "Todas" && s.moneda !== filters.moneda) return false;
    if (!matchesProbabilidad(s.probabilidad, filters.probabilidad)) return false;

    if (filters.email === "Con email" && !s.email.trim()) return false;
    if (filters.email === "Sin email" && s.email.trim()) return false;

    return true;
  });
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

export function getUniqueSegmentos(sponsors: Sponsor[]): string[] {
  return uniqueSorted(sponsors.map((s) => s.segmento));
}

export function getUniquePrioridades(sponsors: Sponsor[]): string[] {
  return uniqueSorted(sponsors.map((s) => s.prioridad));
}

export function getUniqueRegiones(sponsors: Sponsor[]): string[] {
  return uniqueSorted(sponsors.map((s) => s.region));
}

export function getUniqueResponsables(sponsors: Sponsor[]): string[] {
  return uniqueSorted(sponsors.map((s) => s.responsable));
}

export function countActiveFilters(filters: SponsorFilters): number {
  let count = 0;
  if (filters.search.trim()) count += 1;
  if (filters.estado !== "Todos") count += 1;
  if (filters.categoria !== "Todas") count += 1;
  if (filters.segmento !== "Todos") count += 1;
  if (filters.prioridad !== "Todos") count += 1;
  if (filters.region !== "Todos") count += 1;
  if (filters.responsable !== "Todos") count += 1;
  if (filters.moneda !== "Todas") count += 1;
  if (filters.probabilidad !== "Todos") count += 1;
  if (filters.email !== "Todos") count += 1;
  return count;
}

export { sponsorKey };
