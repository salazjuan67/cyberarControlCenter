"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import {
  mapConfig,
  mapSponsor,
  mapInscripcion,
  mapGasto,
  mapEscenario,
  configToRow,
  sponsorToRow,
  inscripcionToRow,
  gastoToRow,
  escenarioToRow,
} from "@/lib/supabase/mappers";
import {
  defaultConfig,
  mockSponsors,
  mockInscripciones,
  mockGastos,
  defaultEscenarios,
} from "@/data/mockData";
import type {
  EventConfig,
  Sponsor,
  Inscripcion,
  Gasto,
  EscenarioConfig,
} from "@/types";

export interface AppData {
  config: EventConfig;
  sponsors: Sponsor[];
  inscripciones: Inscripcion[];
  gastos: Gasto[];
  escenarios: EscenarioConfig[];
}

async function seedDatabase() {
  const supabase = createSupabaseServer();

  await supabase.from("event_config").upsert(configToRow(defaultConfig));
  await supabase.from("sponsors").upsert(mockSponsors.map(sponsorToRow));
  await supabase
    .from("inscripciones")
    .upsert(mockInscripciones.map(inscripcionToRow));
  await supabase.from("gastos").upsert(mockGastos.map(gastoToRow));
  await supabase
    .from("escenarios")
    .upsert(defaultEscenarios.map(escenarioToRow));

  return {
    config: defaultConfig,
    sponsors: mockSponsors,
    inscripciones: mockInscripciones,
    gastos: mockGastos,
    escenarios: defaultEscenarios,
  };
}

export async function fetchAllData(): Promise<AppData> {
  await requireAuth();
  const supabase = createSupabaseServer();

  const [configRes, sponsorsRes, inscripcionesRes, gastosRes, escenariosRes] =
    await Promise.all([
      supabase.from("event_config").select("*").eq("id", 1).maybeSingle(),
      supabase.from("sponsors").select("*").order("created_at"),
      supabase.from("inscripciones").select("*").order("created_at"),
      supabase.from("gastos").select("*").order("created_at"),
      supabase.from("escenarios").select("*"),
    ]);

  const hasData =
    configRes.data ||
    (sponsorsRes.data && sponsorsRes.data.length > 0) ||
    (inscripcionesRes.data && inscripcionesRes.data.length > 0);

  if (!hasData) {
    return seedDatabase();
  }

  return {
    config: configRes.data
      ? mapConfig(configRes.data)
      : defaultConfig,
    sponsors: (sponsorsRes.data ?? []).map(mapSponsor),
    inscripciones: (inscripcionesRes.data ?? []).map(mapInscripcion),
    gastos: (gastosRes.data ?? []).map(mapGasto),
    escenarios:
      escenariosRes.data && escenariosRes.data.length > 0
        ? escenariosRes.data.map(mapEscenario)
        : defaultEscenarios,
  };
}

export async function saveConfig(config: EventConfig) {
  await requireAuth();
  const supabase = createSupabaseServer();
  const { error } = await supabase
    .from("event_config")
    .upsert(configToRow(config));
  if (error) throw new Error(error.message);
}

export async function saveSponsor(sponsor: Sponsor) {
  await requireAuth();
  const supabase = createSupabaseServer();
  const { error } = await supabase.from("sponsors").upsert(sponsorToRow(sponsor));
  if (error) throw new Error(error.message);
}

export async function removeSponsor(id: string) {
  await requireAuth();
  const supabase = createSupabaseServer();
  const { error } = await supabase.from("sponsors").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function saveInscripcion(inscripcion: Inscripcion) {
  await requireAuth();
  const supabase = createSupabaseServer();
  const { error } = await supabase
    .from("inscripciones")
    .upsert(inscripcionToRow(inscripcion));
  if (error) throw new Error(error.message);
}

export async function removeInscripcion(id: string) {
  await requireAuth();
  const supabase = createSupabaseServer();
  const { error } = await supabase.from("inscripciones").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function saveGasto(gasto: Gasto) {
  await requireAuth();
  const supabase = createSupabaseServer();
  const { error } = await supabase.from("gastos").upsert(gastoToRow(gasto));
  if (error) throw new Error(error.message);
}

export async function removeGasto(id: string) {
  await requireAuth();
  const supabase = createSupabaseServer();
  const { error } = await supabase.from("gastos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function saveEscenario(escenario: EscenarioConfig) {
  await requireAuth();
  const supabase = createSupabaseServer();
  const { error } = await supabase
    .from("escenarios")
    .upsert(escenarioToRow(escenario));
  if (error) throw new Error(error.message);
}

export async function clearAllDataInDb() {
  await requireAuth();
  const supabase = createSupabaseServer();
  await Promise.all([
    supabase.from("sponsors").delete().neq("id", ""),
    supabase.from("inscripciones").delete().neq("id", ""),
    supabase.from("gastos").delete().neq("id", ""),
  ]);
}

export async function resetToDefaultsInDb(): Promise<AppData> {
  await requireAuth();
  const supabase = createSupabaseServer();

  await Promise.all([
    supabase.from("sponsors").delete().neq("id", ""),
    supabase.from("inscripciones").delete().neq("id", ""),
    supabase.from("gastos").delete().neq("id", ""),
    supabase.from("escenarios").delete().neq("tipo", ""),
  ]);

  await supabase.from("event_config").upsert(configToRow(defaultConfig));
  await supabase.from("sponsors").insert(mockSponsors.map(sponsorToRow));
  await supabase
    .from("inscripciones")
    .insert(mockInscripciones.map(inscripcionToRow));
  await supabase.from("gastos").insert(mockGastos.map(gastoToRow));
  await supabase
    .from("escenarios")
    .insert(defaultEscenarios.map(escenarioToRow));

  return {
    config: defaultConfig,
    sponsors: mockSponsors,
    inscripciones: mockInscripciones,
    gastos: mockGastos,
    escenarios: defaultEscenarios,
  };
}
