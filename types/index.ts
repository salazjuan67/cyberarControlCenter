// ─── Moneda ──────────────────────────────────────────────────────────────────
export type Moneda = "USD" | "ARS" | "EUR";

export const MONEDAS: Moneda[] = ["USD", "ARS", "EUR"];

// ─── Configuración General ───────────────────────────────────────────────────
export interface EventConfig {
  nombreEvento: string;
  anio: number;
  moneda: Moneda;
  fechaInicio: string;
  fechaCierreInscripciones: string;
  metaPresencial: number;
  metaVirtual: number;
  metaSponsors: number;
  breakEven: number;
  breakEvenMoneda: Moneda;
}

// ─── Sponsors ────────────────────────────────────────────────────────────────
export type SponsorCategoria = "Platino" | "Oro" | "Plata" | "Bronce" | "Institucional";
export type SponsorEstado =
  | "Lead"
  | "Contactado"
  | "Propuesta enviada"
  | "En negociación"
  | "Confirmado"
  | "Perdido";

export interface Sponsor {
  id: string;
  empresa: string;
  contacto: string;
  email: string;
  telefono: string;
  categoria: SponsorCategoria;
  estado: SponsorEstado;
  moneda: Moneda;
  montoEstimado: number;
  montoConfirmado: number;
  probabilidad: number;
  responsable: string;
  ultimoContacto: string;
  proximaAccion: string;
  notas: string;
}

// ─── Inscripciones ───────────────────────────────────────────────────────────
export type InscripcionCategoria =
  | "Profesional"
  | "Estudiante"
  | "Militar"
  | "Investigador"
  | "Invitado"
  | "Expositor";
export type InscripcionModalidad = "Presencial" | "Virtual";

export interface Inscripcion {
  id: string;
  categoria: InscripcionCategoria;
  modalidad: InscripcionModalidad;
  moneda: Moneda;
  precioUnitario: number;
  cantidadConfirmada: number;
  cantidadProyectada: number;
}

// ─── Gastos ───────────────────────────────────────────────────────────────────
export type GastoCategoria =
  | "Técnica"
  | "Streaming"
  | "Catering"
  | "Marketing"
  | "Diseño"
  | "Merchandising"
  | "Personal"
  | "Infraestructura"
  | "Otros";
export type GastoEstado = "Pendiente" | "Confirmado" | "Pagado";

export interface Gasto {
  id: string;
  concepto: string;
  categoria: GastoCategoria;
  moneda: Moneda;
  presupuestoEstimado: number;
  costoReal: number;
  estado: GastoEstado;
  proveedor: string;
  fechaPago: string;
  notas: string;
}

// ─── Escenarios ───────────────────────────────────────────────────────────────
export type EscenarioTipo = "Conservador" | "Esperado" | "Optimista";

export interface EscenarioConfig {
  tipo: EscenarioTipo;
  moneda: Moneda;
  asistentesPresenciales: number;
  asistentesVirtuales: number;
  sponsorsConfirmados: number;
  sponsorsPotenciales: number;
  gastosEstimados: number;
  precioPromPresencial: number;
  precioPromVirtual: number;
  montoPromSponsor: number;
}

export interface EscenarioResultado extends EscenarioConfig {
  ingresosInscripciones: number;
  ingresosSponsors: number;
  ingresosTotales: number;
  egresosTotales: number;
  resultadoNeto: number;
  margen: number;
  breakEven: number;
}

// ─── KPIs ────────────────────────────────────────────────────────────────────
export interface KPIs {
  moneda: Moneda;
  ingresosConfirmados: number;
  ingresosProyectados: number;
  gastosConfirmados: number;
  gastosProyectados: number;
  resultadoNeto: number;
  breakEven: number;
  sponsorsConfirmados: number;
  sponsorsNegociacion: number;
  inscripcionesPresenciales: number;
  inscripcionesVirtuales: number;
  totalSponsors: number;
  avanceBreakEven: number;
}
