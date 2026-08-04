"use server";

import { requireAuth } from "@/lib/auth";
import { fetchAllRegistrations, isRegistrationSyncConfigured } from "@/lib/cyberar/registrations-client";
import {
  attendeeSyncFingerprint,
  mergeRegistrationIntoAttendee,
  normalizeRegistrationEmail,
} from "@/lib/asistentes/registration-sync";
import { mapAsistentePotencial, asistentePotencialToRow } from "@/lib/supabase/mappers";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { AsistentePotencial } from "@/types/asistentes";
import type { RegistrationSyncResult, RegistrationSyncStatus } from "@/types/registration-sync";

interface SyncRunRow {
  id: string;
  generated_at: string | null;
  synced_at: string;
  fetched_count: number;
  created_count: number;
  updated_count: number;
  unchanged_count: number;
  error_count: number;
  errors: unknown;
}

function mapSyncRun(row: SyncRunRow): RegistrationSyncStatus {
  return {
    id: row.id,
    generatedAt: row.generated_at ?? "",
    syncedAt: row.synced_at,
    fetched: Number(row.fetched_count),
    created: Number(row.created_count),
    updated: Number(row.updated_count),
    unchanged: Number(row.unchanged_count),
    errors: Array.isArray(row.errors) ? row.errors.map(String) : [],
  };
}

export async function getRegistrationSyncStatus(): Promise<{
  configured: boolean;
  lastSync: RegistrationSyncStatus | null;
}> {
  await requireAuth();
  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("attendee_registration_syncs")
    .select("*")
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    configured: isRegistrationSyncConfigured(),
    lastSync: !error && data ? mapSyncRun(data as SyncRunRow) : null,
  };
}

export async function syncRegistrationAttendees(): Promise<RegistrationSyncResult> {
  await requireAuth();
  const syncedAt = new Date().toISOString();
  const supabase = createSupabaseServer();
  const errors: string[] = [];

  const { generatedAt, registrations } = await fetchAllRegistrations();
  const { data: existingRows, error: existingError } = await supabase
    .from("asistentes_potenciales")
    .select("*");
  if (existingError) throw new Error(existingError.message);

  const existing = (existingRows ?? []).map(mapAsistentePotencial);
  const byEmail = new Map<string, AsistentePotencial>();
  const byRegistrationId = new Map<string, AsistentePotencial>();
  for (const attendee of existing) {
    const email = normalizeRegistrationEmail(attendee.email);
    if (email) byEmail.set(email, attendee);
    if (attendee.registrationId) byRegistrationId.set(attendee.registrationId, attendee);
  }

  const pendingRows: AsistentePotencial[] = [];
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const registration of registrations) {
    const byId = byRegistrationId.get(registration.id) ?? null;
    const byMatchingEmail = byEmail.get(normalizeRegistrationEmail(registration.email)) ?? null;

    if (byId && byMatchingEmail && byId.id !== byMatchingEmail.id) {
      errors.push(
        `Conflicto ${registration.email}: el ID de inscripción y el email apuntan a contactos diferentes`
      );
      continue;
    }

    const current = byId ?? byMatchingEmail;
    const attendeeId = current?.id ?? `ap-reg-${registration.id}`;
    const merged = mergeRegistrationIntoAttendee(
      registration,
      current,
      attendeeId,
      syncedAt
    );

    if (current && attendeeSyncFingerprint(current) === attendeeSyncFingerprint(merged)) {
      unchanged += 1;
      continue;
    }

    pendingRows.push(merged);
    if (current) updated += 1;
    else created += 1;

    byEmail.set(normalizeRegistrationEmail(merged.email), merged);
    byRegistrationId.set(registration.id, merged);
  }

  for (let index = 0; index < pendingRows.length; index += 100) {
    const chunk = pendingRows.slice(index, index + 100);
    const { error } = await supabase
      .from("asistentes_potenciales")
      .upsert(chunk.map(asistentePotencialToRow), { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  const result: RegistrationSyncResult = {
    fetched: registrations.length,
    created,
    updated,
    unchanged,
    errors,
    generatedAt,
    syncedAt,
  };

  const { error: runError } = await supabase.from("attendee_registration_syncs").insert({
    id: `ars-${Date.now()}`,
    generated_at: generatedAt || null,
    synced_at: syncedAt,
    fetched_count: result.fetched,
    created_count: result.created,
    updated_count: result.updated,
    unchanged_count: result.unchanged,
    error_count: result.errors.length,
    errors: result.errors,
  });
  if (runError) {
    result.errors.push(`No se pudo guardar el historial de sync: ${runError.message}`);
  }

  return result;
}
