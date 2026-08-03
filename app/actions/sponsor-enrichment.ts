"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { mapSponsor } from "@/lib/supabase/mappers";
import {
  pickBestCandidate,
  scrapeEmailsFromNotas,
} from "@/lib/sponsors/email-scraper";
import {
  extractWebsiteFromNotas,
  getDomainFromUrl,
} from "@/lib/sponsors/website-parser";
import {
  formatHunterSourceUrl,
  getHunterAccount,
  hunterDomainSearch,
  hunterVerifyEmail,
  isHunterConfigured,
  pickBestHunterEmail,
  sleep,
} from "@/lib/sponsors/hunter";

export interface EnrichmentStats {
  total: number;
  withoutEmail: number;
  withWebsite: number;
  pendingReview: number;
  withEmail: number;
  scannable: number;
}

export interface HunterStatus {
  configured: boolean;
  searchesAvailable?: number;
  planName?: string;
  error?: string;
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
  provider?: "scraper" | "hunter";
}

function hasEmail(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function getScannableSponsors(sponsors: ReturnType<typeof mapSponsor>[]) {
  return sponsors
    .filter((s) => !hasEmail(s.email))
    .filter((s) => !hasEmail(s.proposedEmail))
    .filter((s) => extractWebsiteFromNotas(s.notas));
}

export async function getHunterStatus(): Promise<HunterStatus> {
  await requireAuth();
  if (!isHunterConfigured()) {
    return { configured: false };
  }
  const account = await getHunterAccount();
  return {
    configured: account.configured,
    searchesAvailable: account.searchesAvailable,
    planName: account.planName,
    error: account.error,
  };
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
  const scannable = getScannableSponsors(sponsors);

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

  const candidates = getScannableSponsors((data ?? []).map(mapSponsor)).slice(0, batchSize);

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
    provider: "scraper",
  };
}

export async function scanSponsorEmailsWithHunter(batchSize = 25): Promise<ScanResult> {
  await requireAuth();

  if (!isHunterConfigured()) {
    throw new Error("HUNTER_API_KEY no configurada");
  }

  const supabase = createSupabaseServer();

  const { data, error } = await supabase.from("sponsors").select("*").order("created_at");
  if (error) throw new Error(error.message);

  const candidates = getScannableSponsors((data ?? []).map(mapSponsor)).slice(0, batchSize);

  let found = 0;
  const errors: ScanError[] = [];

  for (const sponsor of candidates) {
    try {
      const website = extractWebsiteFromNotas(sponsor.notas);
      const domain = website ? getDomainFromUrl(website) : null;

      if (!domain) {
        errors.push({
          id: sponsor.id,
          empresa: sponsor.empresa,
          error: "Sin dominio válido en notas",
        });
        continue;
      }

      const result = await hunterDomainSearch(domain);
      const best = pickBestHunterEmail(result.emails, domain);

      if (best) {
        const { error: updateError } = await supabase
          .from("sponsors")
          .update({
            proposed_email: best.value,
            email_source_url: formatHunterSourceUrl(domain, best.confidence, best.position),
          })
          .eq("id", sponsor.id);

        if (updateError) throw updateError;
        found++;
      } else {
        errors.push({
          id: sponsor.id,
          empresa: sponsor.empresa,
          error: result.error ?? "Hunter no encontró emails útiles",
        });
      }

      await sleep(500);
    } catch (err) {
      errors.push({
        id: sponsor.id,
        empresa: sponsor.empresa,
        error: err instanceof Error ? err.message : "Error con Hunter",
      });
    }
  }

  return {
    scanned: candidates.length,
    found,
    skipped: Math.max(0, batchSize - candidates.length),
    errors,
    provider: "hunter",
  };
}

export async function approveProposedEmail(sponsorId: string): Promise<void> {
  await requireAuth();
  const supabase = createSupabaseServer();

  const { data, error } = await supabase
    .from("sponsors")
    .select("proposed_email, email_source_url")
    .eq("id", sponsorId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || !hasEmail(data.proposed_email)) {
    throw new Error("Este sponsor no tiene email propuesto");
  }

  const proposedEmail = data.proposed_email;

  if (isHunterConfigured()) {
    const verification = await hunterVerifyEmail(proposedEmail);
    if (verification.status === "invalid" || verification.status === "disposable") {
      throw new Error(
        `Hunter marcó el email como ${verification.status}. Revisá la propuesta antes de aprobar.`
      );
    }
  }

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
