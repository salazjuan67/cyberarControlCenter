import type { FinanceSummary } from "@/types/finance-summary";
import type { Inscripcion, Moneda } from "@/types";

function filterByMoneda(inscripciones: Inscripcion[], moneda: Moneda): Inscripcion[] {
  return inscripciones.filter((i) => i.moneda === moneda);
}

function manualInscripcionesConfirmado(
  inscripciones: Inscripcion[],
  moneda: Moneda
): number {
  return filterByMoneda(inscripciones, moneda).reduce(
    (acc, i) => acc + i.precioUnitario * i.cantidadConfirmada,
    0
  );
}

function manualInscripcionesProyectado(
  inscripciones: Inscripcion[],
  moneda: Moneda
): number {
  return filterByMoneda(inscripciones, moneda).reduce(
    (acc, i) => acc + i.precioUnitario * i.cantidadProyectada,
    0
  );
}

function manualAsistentesPresenciales(
  inscripciones: Inscripcion[],
  moneda?: Moneda
): number {
  const list = moneda ? filterByMoneda(inscripciones, moneda) : inscripciones;
  return list
    .filter((i) => i.modalidad === "Presencial")
    .reduce((acc, i) => acc + i.cantidadConfirmada, 0);
}

function manualAsistentesVirtuales(
  inscripciones: Inscripcion[],
  moneda?: Moneda
): number {
  const list = moneda ? filterByMoneda(inscripciones, moneda) : inscripciones;
  return list
    .filter((i) => i.modalidad === "Virtual")
    .reduce((acc, i) => acc + i.cantidadConfirmada, 0);
}

/** Monedas con ingresos aprobados en el pull CYBER.AR */
export function getFinanceMonedas(
  summary: FinanceSummary | null | undefined
): Moneda[] {
  if (!summary) return [];
  return (Object.keys(summary.currency_totals) as Moneda[]).filter(
    (m) => (summary.currency_totals[m]?.total ?? 0) > 0
  );
}

export function hasFinanceDataForMoneda(
  summary: FinanceSummary | null | undefined,
  moneda: Moneda
): boolean {
  return (summary?.currency_totals[moneda]?.total ?? 0) > 0;
}

export function getFinanceIngresosConfirmados(
  summary: FinanceSummary | null | undefined,
  moneda: Moneda
): number {
  return summary?.currency_totals[moneda]?.total ?? 0;
}

export function getFinanceAsistentesByModalidad(
  summary: FinanceSummary | null | undefined
): { presencial: number; virtual: number; sinDato: number } {
  const by = summary?.participants?.by_modalidad ?? {};
  return {
    presencial: by.presencial ?? 0,
    virtual: by.virtual ?? 0,
    sinDato: by.sin_dato ?? 0,
  };
}

export function getFinanceParticipantsByCategoria(
  summary: FinanceSummary | null | undefined
): Record<string, number> {
  return summary?.participants?.by_categoria ?? {};
}

/** Ingresos confirmados: API (pagos aprobados) completa o reemplaza manual */
export function mergeInscripcionesConfirmado(
  inscripciones: Inscripcion[],
  moneda: Moneda,
  summary: FinanceSummary | null | undefined
): number {
  const manual = manualInscripcionesConfirmado(inscripciones, moneda);
  const fromApi = getFinanceIngresosConfirmados(summary, moneda);
  if (fromApi > 0) return Math.max(fromApi, manual);
  return manual;
}

/** Proyección: no baja del confirmado real del API */
export function mergeInscripcionesProyectado(
  inscripciones: Inscripcion[],
  moneda: Moneda,
  summary: FinanceSummary | null | undefined
): number {
  const manual = manualInscripcionesProyectado(inscripciones, moneda);
  const confirmed = mergeInscripcionesConfirmado(inscripciones, moneda, summary);
  return Math.max(manual, confirmed);
}

export function mergeAsistentesPresenciales(
  inscripciones: Inscripcion[],
  summary: FinanceSummary | null | undefined,
  moneda?: Moneda
): number {
  const manual = manualAsistentesPresenciales(inscripciones, moneda);
  if (!summary || (moneda && !hasFinanceDataForMoneda(summary, moneda))) {
    return manual;
  }
  const { presencial } = getFinanceAsistentesByModalidad(summary);
  return Math.max(presencial, manual);
}

export function mergeAsistentesVirtuales(
  inscripciones: Inscripcion[],
  summary: FinanceSummary | null | undefined,
  moneda?: Moneda
): number {
  const manual = manualAsistentesVirtuales(inscripciones, moneda);
  if (!summary || (moneda && !hasFinanceDataForMoneda(summary, moneda))) {
    return manual;
  }
  const { virtual } = getFinanceAsistentesByModalidad(summary);
  return Math.max(virtual, manual);
}

/** Datos para gráfico por categoría (confirmados desde API) */
export function mergeParticipantsByCategoria(
  inscripciones: Inscripcion[],
  summary: FinanceSummary | null | undefined
): Record<string, { confirmados: number; proyectados: number }> {
  const acc: Record<string, { confirmados: number; proyectados: number }> = {};

  for (const i of inscripciones) {
    if (!acc[i.categoria]) acc[i.categoria] = { confirmados: 0, proyectados: 0 };
    acc[i.categoria].confirmados += i.cantidadConfirmada;
    acc[i.categoria].proyectados += i.cantidadProyectada;
  }

  const fromApi = getFinanceParticipantsByCategoria(summary);
  for (const [key, count] of Object.entries(fromApi)) {
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    if (!acc[label]) acc[label] = { confirmados: 0, proyectados: 0 };
    acc[label].confirmados = Math.max(acc[label].confirmados, count);
    acc[label].proyectados = Math.max(acc[label].proyectados, count);
  }

  return acc;
}

/** Presencial / virtual confirmados para gráficos */
export function mergeModalidadConfirmados(
  inscripciones: Inscripcion[],
  summary: FinanceSummary | null | undefined,
  moneda?: Moneda
): { presencial: number; virtual: number } {
  return {
    presencial: mergeAsistentesPresenciales(inscripciones, summary, moneda),
    virtual: mergeAsistentesVirtuales(inscripciones, summary, moneda),
  };
}
