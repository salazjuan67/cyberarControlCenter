import type { AsistenteEstado, AsistentePotencial } from "@/types/asistentes";

export interface AsistenteFilters {
  search: string;
  estado: AsistenteEstado | "Todos";
  categoria: AsistentePotencial["categoria"] | "Todas";
  registrationStatus: "Todos" | "none" | "confirmed" | "pending" | "rejected";
}

export const DEFAULT_ASISTENTE_FILTERS: AsistenteFilters = {
  search: "",
  estado: "Todos",
  categoria: "Todas",
  registrationStatus: "Todos",
};

const ABANDONED_PAYMENT_STATUSES = new Set(["pendiente", "iniciado"]);

export function isAbandonedAttendee(attendee: AsistentePotencial): boolean {
  const registrationStatus = attendee.registrationStatus?.trim().toLowerCase();
  const paymentStatus = attendee.paymentStatus?.trim().toLowerCase();
  return (
    registrationStatus === "pending" &&
    ABANDONED_PAYMENT_STATUSES.has(paymentStatus ?? "")
  );
}

export function filterAsistentes(
  asistentes: AsistentePotencial[],
  filters: AsistenteFilters
): AsistentePotencial[] {
  const q = filters.search.trim().toLowerCase();

  return asistentes.filter((a) => {
    if (filters.estado !== "Todos" && a.estado !== filters.estado) return false;
    if (filters.categoria !== "Todas" && a.categoria !== filters.categoria) return false;
    if (
      filters.registrationStatus !== "Todos" &&
      (filters.registrationStatus === "none"
        ? Boolean(a.registrationStatus)
        : a.registrationStatus !== filters.registrationStatus)
    ) {
      return false;
    }
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
