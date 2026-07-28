import type { EventConfig, EscenarioConfig, EscenarioTipo, Moneda } from "@/types";

/** Configuración inicial del evento (sin datos financieros de ejemplo) */
export const defaultConfig: EventConfig = {
  nombreEvento: "CYBER.AR 2026",
  anio: 2026,
  moneda: "ARS",
  fechaInicio: "2026-10-15",
  fechaCierreInscripciones: "2026-10-10",
  metaPresencial: 300,
  metaVirtual: 500,
  metaSponsors: 15,
  breakEven: 0,
  breakEvenMoneda: "ARS",
};

const ESCENARIO_TIPOS: EscenarioTipo[] = [
  "Conservador",
  "Esperado",
  "Optimista",
];

/** Plantillas vacías para los 3 escenarios (el usuario carga valores reales) */
export function buildEmptyEscenarios(moneda: Moneda = "ARS"): EscenarioConfig[] {
  return ESCENARIO_TIPOS.map((tipo) => ({
    tipo,
    moneda,
    asistentesPresenciales: 0,
    asistentesVirtuales: 0,
    sponsorsConfirmados: 0,
    sponsorsPotenciales: 0,
    gastosEstimados: 0,
    precioPromPresencial: 0,
    precioPromVirtual: 0,
    montoPromSponsor: 0,
  }));
}

export const emptyEscenarios = buildEmptyEscenarios();
