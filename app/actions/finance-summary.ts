"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import {
  fetchFinanceSummaryFromApi,
  isFinanceSummaryConfigured,
} from "@/lib/cyberar/finance-summary-client";
import type {
  FinanceSummary,
  FinanceSummaryFetchOptions,
  FinanceSummarySyncResult,
} from "@/types/finance-summary";

interface FinanceSummaryCacheRow {
  payload: FinanceSummary;
  generated_at: string;
  synced_at: string;
}

function mapCacheRow(row: FinanceSummaryCacheRow): FinanceSummary {
  return {
    ...row.payload,
    synced_at: row.synced_at,
  };
}

async function loadCachedFinanceSummary(): Promise<FinanceSummary | null> {
  try {
    const supabase = createSupabaseServer();
    const { data, error } = await supabase
      .from("finance_summary_cache")
      .select("payload, generated_at, synced_at")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return null;

    return mapCacheRow(data as FinanceSummaryCacheRow);
  } catch {
    return null;
  }
}

async function persistFinanceSummary(summary: FinanceSummary): Promise<void> {
  try {
    const supabase = createSupabaseServer();
    const syncedAt = new Date().toISOString();

    await supabase.from("finance_summary_cache").upsert({
      id: 1,
      payload: {
        ok: summary.ok,
        generated_at: summary.generated_at,
        filters: summary.filters,
        currency_totals: summary.currency_totals,
        participants: summary.participants,
      },
      generated_at: summary.generated_at,
      synced_at: syncedAt,
    });
  } catch {
    // Cache opcional: si la tabla no existe, igual devolvemos el pull
  }
}

export async function getFinanceSummaryStatus(): Promise<{
  configured: boolean;
}> {
  await requireAuth();
  return { configured: isFinanceSummaryConfigured() };
}

export async function loadFinanceSummary(): Promise<FinanceSummary | null> {
  await requireAuth();
  return loadCachedFinanceSummary();
}

export async function syncFinanceSummary(
  options?: FinanceSummaryFetchOptions
): Promise<FinanceSummarySyncResult> {
  await requireAuth();

  if (!isFinanceSummaryConfigured()) {
    const cached = await loadCachedFinanceSummary();
    return {
      summary: cached,
      source: "cache",
      error: "FINANCE_API_KEY no configurada",
    };
  }

  try {
    const summary = await fetchFinanceSummaryFromApi(options);
    await persistFinanceSummary(summary);
    return {
      summary: { ...summary, synced_at: new Date().toISOString() },
      source: "api",
    };
  } catch (err) {
    const cached = await loadCachedFinanceSummary();
    const message =
      err instanceof Error ? err.message : "Error al sincronizar finance-summary";
    return {
      summary: cached,
      source: "cache",
      error: message,
    };
  }
}
