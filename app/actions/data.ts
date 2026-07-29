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
  buildEmptyEscenarios,
} from "@/data/defaults";
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

async function ensureEscenarios(
  supabase: ReturnType<typeof createSupabaseServer>,
  moneda: EventConfig["moneda"],
  existing: EscenarioConfig[] | undefined
): Promise<EscenarioConfig[]> {
  if (existing && existing.length > 0) return existing;

  const empty = buildEmptyEscenarios(moneda);
  await supabase.from("escenarios").upsert(empty.map(escenarioToRow));
  return empty;
}

async function seedInitialDatabase(): Promise<AppData> {
  const supabase = createSupabaseServer();

  await supabase.from("event_config").upsert(configToRow(defaultConfig));
  const escenarios = await ensureEscenarios(supabase, defaultConfig.moneda, []);

  return {
    config: defaultConfig,
    sponsors: [],
    inscripciones: [],
    gastos: [],
    escenarios,
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

  const errors = [
    configRes.error,
    sponsorsRes.error,
    inscripcionesRes.error,
    gastosRes.error,
    escenariosRes.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors.map((e) => e!.message).join(" · "));
  }

  const hasData =
    configRes.data ||
    (sponsorsRes.data && sponsorsRes.data.length > 0) ||
    (inscripcionesRes.data && inscripcionesRes.data.length > 0) ||
    (gastosRes.data && gastosRes.data.length > 0) ||
    (escenariosRes.data && escenariosRes.data.length > 0);

  if (!hasData) {
    return seedInitialDatabase();
  }

  const config = configRes.data ? mapConfig(configRes.data) : defaultConfig;
  const mappedEscenarios =
    escenariosRes.data && escenariosRes.data.length > 0
      ? escenariosRes.data.map(mapEscenario)
      : undefined;

  const escenarios = await ensureEscenarios(
    supabase,
    config.moneda,
    mappedEscenarios
  );

  return {
    config,
    sponsors: (sponsorsRes.data ?? []).map(mapSponsor),
    inscripciones: (inscripcionesRes.data ?? []).map(mapInscripcion),
    gastos: (gastosRes.data ?? []).map(mapGasto),
    escenarios,
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
  const { error } = await supabase
    .from("sponsors")
    .upsert(sponsorToRow(sponsor), { onConflict: "id" });
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
    .upsert(inscripcionToRow(inscripcion), { onConflict: "id" });
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
  const { error } = await supabase
    .from("gastos")
    .upsert(gastoToRow(gasto), { onConflict: "id" });
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
    .upsert(escenarioToRow(escenario), { onConflict: "tipo" });
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
