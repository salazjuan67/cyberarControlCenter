import type {
  EventConfig,
  Sponsor,
  Inscripcion,
  Gasto,
  EscenarioConfig,
  Moneda,
} from "@/types";
import type { AsistentePotencial } from "@/types/asistentes";

function asMoneda(value: unknown): Moneda {
  if (value === "USD" || value === "ARS" || value === "EUR") return value;
  return "ARS";
}

export function mapConfig(row: Record<string, unknown>): EventConfig {
  return {
    nombreEvento: row.nombre_evento as string,
    anio: row.anio as number,
    moneda: asMoneda(row.moneda),
    fechaInicio: row.fecha_inicio as string,
    fechaCierreInscripciones: row.fecha_cierre_inscripciones as string,
    metaPresencial: row.meta_presencial as number,
    metaVirtual: row.meta_virtual as number,
    metaSponsors: row.meta_sponsors as number,
    breakEven: Number(row.break_even),
    breakEvenMoneda: asMoneda(row.break_even_moneda ?? row.moneda),
  };
}

export function configToRow(config: EventConfig) {
  return {
    id: 1,
    nombre_evento: config.nombreEvento,
    anio: config.anio,
    moneda: config.moneda,
    fecha_inicio: config.fechaInicio,
    fecha_cierre_inscripciones: config.fechaCierreInscripciones,
    meta_presencial: config.metaPresencial,
    meta_virtual: config.metaVirtual,
    meta_sponsors: config.metaSponsors,
    break_even: config.breakEven,
    break_even_moneda: config.breakEvenMoneda,
  };
}

export function mapSponsor(row: Record<string, unknown>): Sponsor {
  return {
    id: row.id as string,
    empresa: row.empresa as string,
    contacto: (row.contacto as string) ?? "",
    email: (row.email as string) ?? "",
    telefono: (row.telefono as string) ?? "",
    categoria: row.categoria as Sponsor["categoria"],
    estado: row.estado as Sponsor["estado"],
    moneda: asMoneda(row.moneda),
    montoEstimado: Number(row.monto_estimado),
    montoConfirmado: Number(row.monto_confirmado),
    probabilidad: row.probabilidad as number,
    responsable: (row.responsable as string) ?? "",
    segmento: (row.segmento as string) ?? "",
    prioridad: (row.prioridad as string) ?? "",
    region: (row.region as string) ?? "",
    ultimoContacto: (row.ultimo_contacto as string) ?? "",
    proximaAccion: (row.proxima_accion as string) ?? "",
    notas: (row.notas as string) ?? "",
    proposedEmail: (row.proposed_email as string) ?? "",
    emailSourceUrl: (row.email_source_url as string) ?? "",
  };
}

export function sponsorToRow(s: Sponsor) {
  return {
    id: s.id,
    empresa: s.empresa,
    contacto: s.contacto,
    email: s.email,
    telefono: s.telefono,
    categoria: s.categoria,
    estado: s.estado,
    moneda: s.moneda,
    monto_estimado: s.montoEstimado,
    monto_confirmado: s.montoConfirmado,
    probabilidad: s.probabilidad,
    responsable: s.responsable,
    segmento: s.segmento,
    prioridad: s.prioridad,
    region: s.region,
    ultimo_contacto: s.ultimoContacto || null,
    proxima_accion: s.proximaAccion,
    notas: s.notas,
    proposed_email: s.proposedEmail,
    email_source_url: s.emailSourceUrl,
  };
}

export function mapInscripcion(row: Record<string, unknown>): Inscripcion {
  return {
    id: row.id as string,
    categoria: row.categoria as Inscripcion["categoria"],
    modalidad: row.modalidad as Inscripcion["modalidad"],
    moneda: asMoneda(row.moneda),
    precioUnitario: Number(row.precio_unitario),
    cantidadConfirmada: row.cantidad_confirmada as number,
    cantidadProyectada: row.cantidad_proyectada as number,
  };
}

export function inscripcionToRow(i: Inscripcion) {
  return {
    id: i.id,
    categoria: i.categoria,
    modalidad: i.modalidad,
    moneda: i.moneda,
    precio_unitario: i.precioUnitario,
    cantidad_confirmada: i.cantidadConfirmada,
    cantidad_proyectada: i.cantidadProyectada,
  };
}

export function mapGasto(row: Record<string, unknown>): Gasto {
  return {
    id: row.id as string,
    concepto: row.concepto as string,
    categoria: row.categoria as Gasto["categoria"],
    moneda: asMoneda(row.moneda),
    presupuestoEstimado: Number(row.presupuesto_estimado),
    costoReal: Number(row.costo_real),
    estado: row.estado as Gasto["estado"],
    proveedor: (row.proveedor as string) ?? "",
    fechaPago: (row.fecha_pago as string) ?? "",
    notas: (row.notas as string) ?? "",
  };
}

export function gastoToRow(g: Gasto) {
  return {
    id: g.id,
    concepto: g.concepto,
    categoria: g.categoria,
    moneda: g.moneda,
    presupuesto_estimado: g.presupuestoEstimado,
    costo_real: g.costoReal,
    estado: g.estado,
    proveedor: g.proveedor,
    fecha_pago: g.fechaPago || null,
    notas: g.notas,
  };
}

export function mapEscenario(row: Record<string, unknown>): EscenarioConfig {
  return {
    tipo: row.tipo as EscenarioConfig["tipo"],
    moneda: asMoneda(row.moneda),
    asistentesPresenciales: row.asistentes_presenciales as number,
    asistentesVirtuales: row.asistentes_virtuales as number,
    sponsorsConfirmados: Number(row.sponsors_confirmados),
    sponsorsPotenciales: Number(row.sponsors_potenciales),
    gastosEstimados: Number(row.gastos_estimados),
    precioPromPresencial: Number(row.precio_prom_presencial),
    precioPromVirtual: Number(row.precio_prom_virtual),
    montoPromSponsor: Number(row.monto_prom_sponsor),
  };
}

export function escenarioToRow(e: EscenarioConfig) {
  return {
    tipo: e.tipo,
    moneda: e.moneda,
    asistentes_presenciales: e.asistentesPresenciales,
    asistentes_virtuales: e.asistentesVirtuales,
    sponsors_confirmados: e.sponsorsConfirmados,
    sponsors_potenciales: e.sponsorsPotenciales,
    gastos_estimados: e.gastosEstimados,
    precio_prom_presencial: e.precioPromPresencial,
    precio_prom_virtual: e.precioPromVirtual,
    monto_prom_sponsor: e.montoPromSponsor,
  };
}

export function mapAsistentePotencial(row: Record<string, unknown>): AsistentePotencial {
  return {
    id: row.id as string,
    nombre: (row.nombre as string) ?? "",
    apellido: (row.apellido as string) ?? "",
    email: (row.email as string) ?? "",
    telefono: (row.telefono as string) ?? "",
    organizacion: (row.organizacion as string) ?? "",
    cargo: (row.cargo as string) ?? "",
    categoria: row.categoria as AsistentePotencial["categoria"],
    modalidad: (row.modalidad as AsistentePotencial["modalidad"]) ?? "",
    estado: row.estado as AsistentePotencial["estado"],
    origen: (row.origen as string) ?? "",
    pais: (row.pais as string) ?? "",
    region: (row.region as string) ?? "",
    responsable: (row.responsable as string) ?? "",
    probabilidad: row.probabilidad as number,
    ultimoContacto: (row.ultimo_contacto as string) ?? "",
    proximaAccion: (row.proxima_accion as string) ?? "",
    notas: (row.notas as string) ?? "",
  };
}

export function asistentePotencialToRow(a: AsistentePotencial) {
  return {
    id: a.id,
    nombre: a.nombre,
    apellido: a.apellido,
    email: a.email,
    telefono: a.telefono,
    organizacion: a.organizacion,
    cargo: a.cargo,
    categoria: a.categoria,
    modalidad: a.modalidad,
    estado: a.estado,
    origen: a.origen,
    pais: a.pais,
    region: a.region,
    responsable: a.responsable,
    probabilidad: a.probabilidad,
    ultimo_contacto: a.ultimoContacto || null,
    proxima_accion: a.proximaAccion,
    notas: a.notas,
  };
}
