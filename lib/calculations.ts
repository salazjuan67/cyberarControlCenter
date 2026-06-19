import type {
  Sponsor,
  Inscripcion,
  Gasto,
  EscenarioConfig,
  EscenarioResultado,
  KPIs,
} from "@/types";

// ─── Sponsors ────────────────────────────────────────────────────────────────
export function calcSponsorsConfirmados(sponsors: Sponsor[]): number {
  return sponsors
    .filter((s) => s.estado === "Confirmado")
    .reduce((acc, s) => acc + s.montoConfirmado, 0);
}

export function calcSponsorsPotencial(sponsors: Sponsor[]): number {
  return sponsors
    .filter((s) => s.estado !== "Perdido" && s.estado !== "Confirmado")
    .reduce((acc, s) => acc + s.montoEstimado, 0);
}

export function calcSponsorsPonderado(sponsors: Sponsor[]): number {
  return sponsors
    .filter((s) => s.estado !== "Perdido")
    .reduce(
      (acc, s) => acc + (s.montoEstimado * s.probabilidad) / 100,
      0
    );
}

// ─── Inscripciones ───────────────────────────────────────────────────────────
export function calcIngresoConfirmado(insc: Inscripcion): number {
  return insc.precioUnitario * insc.cantidadConfirmada;
}

export function calcIngresoProyectado(insc: Inscripcion): number {
  return insc.precioUnitario * insc.cantidadProyectada;
}

export function calcTotalInscripcionesConfirmado(
  inscripciones: Inscripcion[]
): number {
  return inscripciones.reduce((acc, i) => acc + calcIngresoConfirmado(i), 0);
}

export function calcTotalInscripcionesProyectado(
  inscripciones: Inscripcion[]
): number {
  return inscripciones.reduce((acc, i) => acc + calcIngresoProyectado(i), 0);
}

export function calcAsistentesPresenciales(
  inscripciones: Inscripcion[],
  tipo: "confirmada" | "proyectada" = "confirmada"
): number {
  const field =
    tipo === "confirmada" ? "cantidadConfirmada" : "cantidadProyectada";
  return inscripciones
    .filter((i) => i.modalidad === "Presencial")
    .reduce((acc, i) => acc + i[field], 0);
}

export function calcAsistentesVirtuales(
  inscripciones: Inscripcion[],
  tipo: "confirmada" | "proyectada" = "confirmada"
): number {
  const field =
    tipo === "confirmada" ? "cantidadConfirmada" : "cantidadProyectada";
  return inscripciones
    .filter((i) => i.modalidad === "Virtual")
    .reduce((acc, i) => acc + i[field], 0);
}

// ─── Gastos ───────────────────────────────────────────────────────────────────
export function calcTotalPresupuestado(gastos: Gasto[]): number {
  return gastos.reduce((acc, g) => acc + g.presupuestoEstimado, 0);
}

export function calcTotalGastosReal(gastos: Gasto[]): number {
  return gastos.reduce((acc, g) => acc + g.costoReal, 0);
}

export function calcDesvioPorcentual(gastos: Gasto[]): number {
  const presupuestado = calcTotalPresupuestado(gastos);
  const real = calcTotalGastosReal(gastos);
  if (presupuestado === 0) return 0;
  return ((real - presupuestado) / presupuestado) * 100;
}

// ─── KPIs ────────────────────────────────────────────────────────────────────
export function calcKPIs(
  sponsors: Sponsor[],
  inscripciones: Inscripcion[],
  gastos: Gasto[],
  breakEvenTarget: number
): KPIs {
  const ingresosSponsorsConf = calcSponsorsConfirmados(sponsors);
  const ingresosInscConf = calcTotalInscripcionesConfirmado(inscripciones);
  const ingresosInscProy = calcTotalInscripcionesProyectado(inscripciones);
  const ingresosSponsorsPond = calcSponsorsPonderado(sponsors);

  const ingresosConfirmados = ingresosSponsorsConf + ingresosInscConf;
  const ingresosProyectados =
    ingresosInscProy + ingresosSponsorsConf + ingresosSponsorsPond;

  const gastosConf = gastos
    .filter((g) => g.estado === "Pagado" || g.estado === "Confirmado")
    .reduce((acc, g) => acc + (g.costoReal || g.presupuestoEstimado), 0);

  const gastosProyectados = calcTotalPresupuestado(gastos);

  const resultadoNeto = ingresosProyectados - gastosProyectados;
  const avanceBreakEven =
    breakEvenTarget > 0
      ? Math.min((ingresosConfirmados / breakEvenTarget) * 100, 100)
      : 0;

  return {
    ingresosConfirmados,
    ingresosProyectados,
    gastosConfirmados: gastosConf,
    gastosProyectados,
    resultadoNeto,
    breakEven: breakEvenTarget,
    sponsorsConfirmados: sponsors.filter((s) => s.estado === "Confirmado")
      .length,
    sponsorsNegociacion: sponsors.filter(
      (s) =>
        s.estado === "En negociación" ||
        s.estado === "Propuesta enviada" ||
        s.estado === "Contactado" ||
        s.estado === "Lead"
    ).length,
    inscripcionesPresenciales: calcAsistentesPresenciales(inscripciones),
    inscripcionesVirtuales: calcAsistentesVirtuales(inscripciones),
    totalSponsors: sponsors.filter((s) => s.estado !== "Perdido").length,
    avanceBreakEven,
  };
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
  const breakEven = precioPromPonderado > 0 ? costoFijoRef / precioPromPonderado : 0;

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
