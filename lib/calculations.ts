import type {
  Sponsor,
  Inscripcion,
  Gasto,
  EscenarioConfig,
  EscenarioResultado,
  KPIs,
  Moneda,
} from "@/types";
import type { FinanceSummary } from "@/types/finance-summary";
import { MONEDAS } from "@/types";
import {
  getFinanceMonedas,
  mergeAsistentesPresenciales,
  mergeAsistentesVirtuales,
  mergeInscripcionesConfirmado,
  mergeInscripcionesProyectado,
} from "@/lib/finance-summary-merge";

// ─── Helpers ───────────────────────────────────────────────────────────────────
export function filterByMoneda<T extends { moneda: Moneda }>(
  items: T[],
  moneda: Moneda
): T[] {
  return items.filter((item) => item.moneda === moneda);
}

function hasSponsorAmounts(s: Sponsor): boolean {
  return s.montoEstimado > 0 || s.montoConfirmado > 0;
}

function hasInscripcionAmounts(i: Inscripcion): boolean {
  return i.precioUnitario > 0 && (i.cantidadConfirmada > 0 || i.cantidadProyectada > 0);
}

function hasGastoAmounts(g: Gasto): boolean {
  return g.presupuestoEstimado > 0 || g.costoReal > 0;
}

function hasEscenarioAmounts(e: EscenarioConfig): boolean {
  return (
    e.gastosEstimados > 0 ||
    e.precioPromPresencial > 0 ||
    e.precioPromVirtual > 0 ||
    e.montoPromSponsor > 0
  );
}

export function getActiveMonedas(
  sponsors: Sponsor[],
  inscripciones: Inscripcion[],
  gastos: Gasto[],
  escenarios: EscenarioConfig[] = [],
  financeSummary?: FinanceSummary | null
): Moneda[] {
  const active = new Set<Moneda>();

  for (const s of sponsors) {
    if (hasSponsorAmounts(s)) active.add(s.moneda);
  }
  for (const i of inscripciones) {
    if (hasInscripcionAmounts(i)) active.add(i.moneda);
  }
  for (const g of gastos) {
    if (hasGastoAmounts(g)) active.add(g.moneda);
  }
  for (const e of escenarios) {
    if (hasEscenarioAmounts(e)) active.add(e.moneda);
  }
  for (const m of getFinanceMonedas(financeSummary)) {
    active.add(m);
  }

  return MONEDAS.filter((m) => active.has(m));
}

// ─── Sponsors ────────────────────────────────────────────────────────────────
export function calcSponsorsConfirmados(
  sponsors: Sponsor[],
  moneda?: Moneda
): number {
  const list = moneda ? filterByMoneda(sponsors, moneda) : sponsors;
  return list
    .filter((s) => s.estado === "Confirmado")
    .reduce((acc, s) => acc + s.montoConfirmado, 0);
}

export function calcSponsorsPotencial(
  sponsors: Sponsor[],
  moneda?: Moneda
): number {
  const list = moneda ? filterByMoneda(sponsors, moneda) : sponsors;
  return list
    .filter((s) => s.estado !== "Perdido" && s.estado !== "Confirmado")
    .reduce((acc, s) => acc + s.montoEstimado, 0);
}

export function calcSponsorsPonderado(
  sponsors: Sponsor[],
  moneda?: Moneda
): number {
  const list = moneda ? filterByMoneda(sponsors, moneda) : sponsors;
  return list
    .filter((s) => s.estado !== "Perdido")
    .reduce((acc, s) => acc + (s.montoEstimado * s.probabilidad) / 100, 0);
}

// ─── Inscripciones ───────────────────────────────────────────────────────────
export function calcIngresoConfirmado(insc: Inscripcion): number {
  return insc.precioUnitario * insc.cantidadConfirmada;
}

export function calcIngresoProyectado(insc: Inscripcion): number {
  return insc.precioUnitario * insc.cantidadProyectada;
}

export function calcTotalInscripcionesConfirmado(
  inscripciones: Inscripcion[],
  moneda?: Moneda,
  financeSummary?: FinanceSummary | null
): number {
  if (moneda) {
    return mergeInscripcionesConfirmado(inscripciones, moneda, financeSummary);
  }
  const monedas = getActiveMonedas([], inscripciones, [], [], financeSummary);
  if (monedas.length === 0) {
    return inscripciones.reduce((acc, i) => acc + calcIngresoConfirmado(i), 0);
  }
  return monedas.reduce(
    (acc, m) => acc + mergeInscripcionesConfirmado(inscripciones, m, financeSummary),
    0
  );
}

export function calcTotalInscripcionesProyectado(
  inscripciones: Inscripcion[],
  moneda?: Moneda,
  financeSummary?: FinanceSummary | null
): number {
  if (moneda) {
    return mergeInscripcionesProyectado(inscripciones, moneda, financeSummary);
  }
  const monedas = getActiveMonedas([], inscripciones, [], [], financeSummary);
  if (monedas.length === 0) {
    return inscripciones.reduce((acc, i) => acc + calcIngresoProyectado(i), 0);
  }
  return monedas.reduce(
    (acc, m) => acc + mergeInscripcionesProyectado(inscripciones, m, financeSummary),
    0
  );
}

export function calcAsistentesPresenciales(
  inscripciones: Inscripcion[],
  tipo: "confirmada" | "proyectada" = "confirmada",
  moneda?: Moneda,
  financeSummary?: FinanceSummary | null
): number {
  if (tipo === "confirmada") {
    return mergeAsistentesPresenciales(inscripciones, financeSummary, moneda);
  }
  const list = moneda ? filterByMoneda(inscripciones, moneda) : inscripciones;
  return list
    .filter((i) => i.modalidad === "Presencial")
    .reduce((acc, i) => acc + i.cantidadProyectada, 0);
}

export function calcAsistentesVirtuales(
  inscripciones: Inscripcion[],
  tipo: "confirmada" | "proyectada" = "confirmada",
  moneda?: Moneda,
  financeSummary?: FinanceSummary | null
): number {
  if (tipo === "confirmada") {
    return mergeAsistentesVirtuales(inscripciones, financeSummary, moneda);
  }
  const list = moneda ? filterByMoneda(inscripciones, moneda) : inscripciones;
  return list
    .filter((i) => i.modalidad === "Virtual")
    .reduce((acc, i) => acc + i.cantidadProyectada, 0);
}

// ─── Gastos ───────────────────────────────────────────────────────────────────
export function calcTotalPresupuestado(
  gastos: Gasto[],
  moneda?: Moneda
): number {
  const list = moneda ? filterByMoneda(gastos, moneda) : gastos;
  return list.reduce((acc, g) => acc + g.presupuestoEstimado, 0);
}

export function calcTotalGastosReal(gastos: Gasto[], moneda?: Moneda): number {
  const list = moneda ? filterByMoneda(gastos, moneda) : gastos;
  return list.reduce((acc, g) => acc + g.costoReal, 0);
}

export function calcDesvioPorcentual(gastos: Gasto[], moneda?: Moneda): number {
  const presupuestado = calcTotalPresupuestado(gastos, moneda);
  const real = calcTotalGastosReal(gastos, moneda);
  if (presupuestado === 0) return 0;
  return ((real - presupuestado) / presupuestado) * 100;
}

// ─── KPIs ────────────────────────────────────────────────────────────────────
export function calcKPIs(
  sponsors: Sponsor[],
  inscripciones: Inscripcion[],
  gastos: Gasto[],
  breakEvenTarget: number,
  moneda: Moneda = "USD",
  financeSummary?: FinanceSummary | null
): KPIs {
  const filteredSponsors = filterByMoneda(sponsors, moneda);
  const filteredGastos = filterByMoneda(gastos, moneda);

  const ingresosSponsorsConf = calcSponsorsConfirmados(filteredSponsors);
  const ingresosInscConf = mergeInscripcionesConfirmado(
    inscripciones,
    moneda,
    financeSummary
  );
  const ingresosInscProy = mergeInscripcionesProyectado(
    inscripciones,
    moneda,
    financeSummary
  );
  const ingresosSponsorsPond = calcSponsorsPonderado(filteredSponsors);

  const ingresosConfirmados = ingresosSponsorsConf + ingresosInscConf;
  const ingresosProyectados =
    ingresosInscProy + ingresosSponsorsConf + ingresosSponsorsPond;

  const gastosConf = filteredGastos
    .filter((g) => g.estado === "Pagado" || g.estado === "Confirmado")
    .reduce((acc, g) => acc + (g.costoReal || g.presupuestoEstimado), 0);

  const gastosProyectados = calcTotalPresupuestado(filteredGastos);
  const resultadoNeto = ingresosProyectados - gastosProyectados;

  const avanceBreakEven =
    breakEvenTarget > 0
      ? Math.min((ingresosConfirmados / breakEvenTarget) * 100, 100)
      : 0;

  return {
    moneda,
    ingresosConfirmados,
    ingresosProyectados,
    gastosConfirmados: gastosConf,
    gastosProyectados,
    resultadoNeto,
    breakEven: breakEvenTarget,
    sponsorsConfirmados: filteredSponsors.filter((s) => s.estado === "Confirmado")
      .length,
    sponsorsNegociacion: filteredSponsors.filter(
      (s) =>
        s.estado === "En negociación" ||
        s.estado === "Propuesta enviada" ||
        s.estado === "Contactado" ||
        s.estado === "Lead"
    ).length,
    inscripcionesPresenciales: mergeAsistentesPresenciales(
      inscripciones,
      financeSummary,
      moneda
    ),
    inscripcionesVirtuales: mergeAsistentesVirtuales(
      inscripciones,
      financeSummary,
      moneda
    ),
    totalSponsors: filteredSponsors.filter((s) => s.estado !== "Perdido").length,
    avanceBreakEven,
  };
}

export function calcKPIsByMoneda(
  sponsors: Sponsor[],
  inscripciones: Inscripcion[],
  gastos: Gasto[],
  breakEvenTarget: number,
  breakEvenMoneda: Moneda,
  financeSummary?: FinanceSummary | null
): Partial<Record<Moneda, KPIs>> {
  const active = getActiveMonedas(sponsors, inscripciones, gastos, [], financeSummary);
  const result: Partial<Record<Moneda, KPIs>> = {};

  for (const moneda of active) {
    const breakEven =
      moneda === breakEvenMoneda ? breakEvenTarget : 0;
    result[moneda] = calcKPIs(
      sponsors,
      inscripciones,
      gastos,
      breakEven,
      moneda,
      financeSummary
    );
  }

  return result;
}

// ─── Escenarios ───────────────────────────────────────────────────────────────
export function calcEscenario(cfg: EscenarioConfig): EscenarioResultado {
  const ingresosInscripciones =
    cfg.asistentesPresenciales * cfg.precioPromPresencial +
    cfg.asistentesVirtuales * cfg.precioPromVirtual;
  const ingresosSponsors =
    (cfg.sponsorsConfirmados + cfg.sponsorsPotenciales * 0.5) *
    cfg.montoPromSponsor;
  const ingresosTotales = ingresosInscripciones + ingresosSponsors;
  const egresosTotales = cfg.gastosEstimados;
  const resultadoNeto = ingresosTotales - egresosTotales;
  const margen =
    ingresosTotales > 0 ? (resultadoNeto / ingresosTotales) * 100 : 0;

  const costoFijoRef = egresosTotales;
  const precioPromPonderado =
    cfg.asistentesPresenciales + cfg.asistentesVirtuales > 0
      ? ingresosInscripciones /
        (cfg.asistentesPresenciales + cfg.asistentesVirtuales)
      : 1;
  const breakEven =
    precioPromPonderado > 0 ? costoFijoRef / precioPromPonderado : 0;

  return {
    ...cfg,
    ingresosInscripciones,
    ingresosSponsors,
    ingresosTotales,
    egresosTotales,
    resultadoNeto,
    margen,
    breakEven,
  };
}

export function getEscenariosByMoneda(
  escenarios: EscenarioConfig[]
): Partial<Record<Moneda, EscenarioConfig[]>> {
  return escenarios.reduce<Partial<Record<Moneda, EscenarioConfig[]>>>(
    (acc, e) => {
      if (!acc[e.moneda]) acc[e.moneda] = [];
      acc[e.moneda]!.push(e);
      return acc;
    },
    {}
  );
}
