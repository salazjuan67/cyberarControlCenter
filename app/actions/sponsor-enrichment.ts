"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { mapSponsor } from "@/lib/supabase/mappers";
import {
  pickBestCandidate,
  scrapeEmailsFromNotas,
} from "@/lib/sponsors/email-scraper";
import { extractWebsiteFromNotas } from "@/lib/sponsors/website-parser";

export interface EnrichmentStats {
  total: number;
  withoutEmail: number;
  withWebsite: number;
  pendingReview: number;
  withEmail: number;
  scannable: number;
}

export interface ScanError {
  id: string;
  empresa: string;
  error: string;
}

export interface ScanResult {
  scanned: number;
  found: number;
  skipped: number;
  errors: ScanError[];
}

function hasEmail(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export async function getEnrichmentStats(): Promise<EnrichmentStats> {
  await requireAuth();
  const supabase = createSupabaseServer();

  const { data, error } = await supabase.from("sponsors").select("*");
  if (error) throw new Error(error.message);

  const sponsors = (data ?? []).map(mapSponsor);
  const withoutEmail = sponsors.filter((s) => !hasEmail(s.email));
  const withWebsite = withoutEmail.filter((s) => extractWebsiteFromNotas(s.notas));
  const pendingReview = sponsors.filter((s) => hasEmail(s.proposedEmail) && !hasEmail(s.email));
  const scannable = withoutEmail.filter(
    (s) => !hasEmail(s.proposedEmail) && extractWebsiteFromNotas(s.notas)
  );

  return {
    total: sponsors.length,
    withoutEmail: withoutEmail.length,
    withWebsite: withWebsite.length,
    pendingReview: pendingReview.length,
    withEmail: sponsors.filter((s) => hasEmail(s.email)).length,
    scannable: scannable.length,
  };
}

export async function scanSponsorEmails(batchSize = 25): Promise<ScanResult> {
  await requireAuth();
  const supabase = createSupabaseServer();

  const { data, error } = await supabase.from("sponsors").select("*").order("created_at");
  if (error) throw new Error(error.message);

  const candidates = (data ?? [])
    .map(mapSponsor)
    .filter((s) => !hasEmail(s.email))
    .filter((s) => !hasEmail(s.proposedEmail))
    .filter((s) => extractWebsiteFromNotas(s.notas))
    .slice(0, batchSize);

  let found = 0;
  const errors: ScanError[] = [];

  for (const sponsor of candidates) {
    try {
      const result = await scrapeEmailsFromNotas(sponsor.notas);
      const best = pickBestCandidate(result.candidates);

      if (best) {
        const { error: updateError } = await supabase
          .from("sponsors")
          .update({
            proposed_email: best.email,
            email_source_url: best.sourceUrl,
          })
          .eq("id", sponsor.id);

        if (updateError) throw updateError;
        found++;
      } else {
        errors.push({
          id: sponsor.id,
          empresa: sponsor.empresa,
          error: result.error ?? "Sin emails detectados",
        });
      }
    } catch (err) {
      errors.push({
        id: sponsor.id,
        empresa: sponsor.empresa,
        error: err instanceof Error ? err.message : "Error al escanear",
      });
    }
  }

  return {
    scanned: candidates.length,
    found,
    skipped: Math.max(0, batchSize - candidates.length),
    errors,
  };
}

export async function approveProposedEmail(sponsorId: string): Promise<void> {
  await requireAuth();
  const supabase = createSupabaseServer();

  const { data, error } = await supabase
    .from("sponsors")
    .select("proposed_email")
    .eq("id", sponsorId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || !hasEmail(data.proposed_email)) {
    throw new Error("Este sponsor no tiene email propuesto");
  }

  const proposedEmail = data.proposed_email;

  const { error: updateError } = await supabase
    .from("sponsors")
    .update({
      email: proposedEmail,
      proposed_email: "",
      email_source_url: "",
    })
    .eq("id", sponsorId);

  if (updateError) throw new Error(updateError.message);
}

export async function rejectProposedEmail(sponsorId: string): Promise<void> {
  await requireAuth();
  const supabase = createSupabaseServer();

  const { error } = await supabase
    .from("sponsors")
    .update({
      proposed_email: "",
      email_source_url: "",
    })
    .eq("id", sponsorId);

  if (error) throw new Error(error.message);
}
