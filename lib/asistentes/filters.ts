import type { AsistenteEstado, AsistentePotencial } from "@/types/asistentes";

export interface AsistenteFilters {
  search: string;
  estado: AsistenteEstado | "Todos";
  categoria: AsistentePotencial["categoria"] | "Todas";
}

export const DEFAULT_ASISTENTE_FILTERS: AsistenteFilters = {
  search: "",
  estado: "Todos",
  categoria: "Todas",
};

export function filterAsistentes(
  asistentes: AsistentePotencial[],
  filters: AsistenteFilters
): AsistentePotencial[] {
  const q = filters.search.trim().toLowerCase();

  return asistentes.filter((a) => {
    if (filters.estado !== "Todos" && a.estado !== filters.estado) return false;
    if (filters.categoria !== "Todas" && a.categoria !== filters.categoria) return false;
    if (!q) return true;

    const haystack = [
      a.nombre,
      a.apellido,
      a.email,
      a.organizacion,
      a.cargo,
      a.origen,
      a.region,
      a.responsable,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}
