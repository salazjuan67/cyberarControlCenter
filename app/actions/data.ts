"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import {
  mapConfig,
  mapSponsor,
  mapInscripcion,
  mapGasto,
  mapEscenario,
  mapAsistentePotencial,
  configToRow,
  sponsorToRow,
  inscripcionToRow,
  gastoToRow,
  escenarioToRow,
  asistentePotencialToRow,
} from "@/lib/supabase/mappers";
import { sponsorKey } from "@/lib/sponsors/import";
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
import type { AsistentePotencial } from "@/types/asistentes";

export interface AppData {
  config: EventConfig;
  sponsors: Sponsor[];
  asistentesPotenciales: AsistentePotencial[];
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
    asistentesPotenciales: [],
    inscripciones: [],
    gastos: [],
    escenarios,
  };
}

export async function fetchAllData(): Promise<AppData> {
  await requireAuth();
  const supabase = createSupabaseServer();

  const [configRes, sponsorsRes, asistentesRes, inscripcionesRes, gastosRes, escenariosRes] =
    await Promise.all([
      supabase.from("event_config").select("*").eq("id", 1).maybeSingle(),
      supabase.from("sponsors").select("*").order("created_at"),
      supabase.from("asistentes_potenciales").select("*").order("created_at"),
      supabase.from("inscripciones").select("*").order("created_at"),
      supabase.from("gastos").select("*").order("created_at"),
      supabase.from("escenarios").select("*"),
    ]);

  const errors = [
    configRes.error,
    sponsorsRes.error,
    asistentesRes.error,
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
    asistentesPotenciales: (asistentesRes.data ?? []).map(mapAsistentePotencial),
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

export async function saveAsistentePotencial(asistente: AsistentePotencial) {
  await requireAuth();
  const supabase = createSupabaseServer();
  const { error } = await supabase
    .from("asistentes_potenciales")
    .upsert(asistentePotencialToRow(asistente), { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export async function removeAsistentePotencial(id: string) {
  await requireAuth();
  const supabase = createSupabaseServer();
  const { error } = await supabase.from("asistentes_potenciales").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export interface RemoveSponsorsWithoutEmailResult {
  deleted: number;
}

export async function removeSponsorsWithoutEmail(): Promise<RemoveSponsorsWithoutEmailResult> {
  await requireAuth();
  const supabase = createSupabaseServer();

  const { data, error } = await supabase.from("sponsors").select("id, email");
  if (error) throw new Error(error.message);

  const ids = (data ?? [])
    .filter((row) => !String(row.email ?? "").trim())
    .map((row) => row.id as string);

  if (ids.length === 0) {
    return { deleted: 0 };
  }

  const chunkSize = 100;
  let deleted = 0;

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error: deleteError } = await supabase.from("sponsors").delete().in("id", chunk);
    if (deleteError) throw new Error(deleteError.message);
    deleted += chunk.length;
  }

  return { deleted };
}

export interface ImportSponsorsOptions {
  replaceDuplicates?: boolean;
}

export interface ImportSponsorsResult {
  imported: number;
  skipped: number;
  updated: number;
  errors: string[];
}

export async function importSponsorsBulk(
  sponsors: Sponsor[],
  options: ImportSponsorsOptions = {}
): Promise<ImportSponsorsResult> {
  await requireAuth();
  const supabase = createSupabaseServer();
  const replaceDuplicates = options.replaceDuplicates ?? false;

  const { data: existingRows, error: fetchError } = await supabase
    .from("sponsors")
    .select("id, empresa, email");

  if (fetchError) throw new Error(fetchError.message);

  const existingByKey = new Map<string, string>();
  for (const row of existingRows ?? []) {
    const key = sponsorKey({
      empresa: String(row.empresa),
      email: String(row.email ?? ""),
    });
    existingByKey.set(key, row.id as string);
  }

  const toUpsert: Sponsor[] = [];
  let skipped = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const sponsor of sponsors) {
    const key = sponsorKey(sponsor);
    const existingId = existingByKey.get(key);

    if (existingId) {
      if (!replaceDuplicates) {
        skipped += 1;
        continue;
      }
      toUpsert.push({ ...sponsor, id: existingId });
      updated += 1;
      continue;
    }

    toUpsert.push(sponsor);
  }

  if (toUpsert.length === 0) {
    return { imported: 0, skipped, updated, errors };
  }

  const chunkSize = 100;
  let imported = 0;

  for (let i = 0; i < toUpsert.length; i += chunkSize) {
    const chunk = toUpsert.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("sponsors")
      .upsert(chunk.map(sponsorToRow), { onConflict: "id" });

    if (error) {
      errors.push(error.message);
      continue;
    }

    imported += chunk.length;
  }

  return {
    imported: replaceDuplicates ? imported - updated : imported,
    skipped,
    updated,
    errors,
  };
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
