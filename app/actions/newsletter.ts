"use server";

import { requireAuth } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { mapConfig, mapSponsor, mapInscripcion, mapGasto } from "@/lib/supabase/mappers";
import { defaultConfig } from "@/data/defaults";
import { calcKPIs } from "@/lib/calculations";
import { loadFinanceSummary } from "@/app/actions/finance-summary";
import {
  assertResendReady,
  getResendClient,
  getResendFromEmail,
  isResendConfigured,
} from "@/lib/resend/client";
import { resolveSponsorRecipients } from "@/lib/newsletter/recipients";
import {
  buildNewsletterHtml,
  buildNewsletterSubject,
  getPrimaryMoneda,
  wrapCustomHtml,
} from "@/lib/newsletter/templates";
import type {
  NewsletterAudience,
  NewsletterPreview,
  NewsletterStatus,
  NewsletterSummaryDraft,
  SendNewsletterInput,
  SendNewsletterResult,
  SendTestEmailInput,
  SendTestEmailResult,
} from "@/types/newsletter";
import type { EventConfig, Gasto, Inscripcion, Sponsor } from "@/types";

const BATCH_SIZE = 100;

async function loadEventContext(): Promise<{
  config: EventConfig;
  sponsors: Sponsor[];
  inscripciones: Inscripcion[];
  gastos: Gasto[];
}> {
  const supabase = createSupabaseServer();

  const [configRes, sponsorsRes, inscripcionesRes, gastosRes] = await Promise.all([
    supabase.from("event_config").select("*").eq("id", 1).maybeSingle(),
    supabase.from("sponsors").select("*").order("created_at"),
    supabase.from("inscripciones").select("*").order("created_at"),
    supabase.from("gastos").select("*").order("created_at"),
  ]);

  if (configRes.error) throw new Error(configRes.error.message);
  if (sponsorsRes.error) throw new Error(sponsorsRes.error.message);
  if (inscripcionesRes.error) throw new Error(inscripcionesRes.error.message);
  if (gastosRes.error) throw new Error(gastosRes.error.message);

  return {
    config: configRes.data ? mapConfig(configRes.data) : defaultConfig,
    sponsors: (sponsorsRes.data ?? []).map(mapSponsor),
    inscripciones: (inscripcionesRes.data ?? []).map(mapInscripcion),
    gastos: (gastosRes.data ?? []).map(mapGasto),
  };
}

export async function getNewsletterStatus(): Promise<NewsletterStatus> {
  await requireAuth();
  return {
    configured: isResendConfigured() && Boolean(getResendFromEmail()),
    fromEmail: getResendFromEmail(),
  };
}

export async function previewNewsletterRecipients(
  audience: NewsletterAudience
): Promise<NewsletterPreview> {
  await requireAuth();
  const { sponsors } = await loadEventContext();
  const { recipients, skipped } = resolveSponsorRecipients(sponsors, audience);

  return { audience, recipients, skipped };
}

export async function buildNewsletterSummaryDraft(
  customBody?: string
): Promise<NewsletterSummaryDraft> {
  await requireAuth();
  const { config, sponsors, inscripciones, gastos } = await loadEventContext();
  const financeSummary = await loadFinanceSummary();
  const moneda = getPrimaryMoneda(config);
  const breakEven = config.breakEvenMoneda === moneda ? config.breakEven : 0;
  const kpis = calcKPIs(
    sponsors,
    inscripciones,
    gastos,
    breakEven,
    moneda,
    financeSummary
  );

  return {
    subject: buildNewsletterSubject(config),
    html: buildNewsletterHtml({ config, kpis, customBody }),
  };
}

export async function sendTestNewsletter(
  input: SendTestEmailInput
): Promise<SendTestEmailResult> {
  await requireAuth();

  const to = input.to.trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: "Email de prueba inválido" };
  }

  try {
    const { from } = assertResendReady();
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: `[Prueba] ${input.subject}`,
      html: input.html,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al enviar email de prueba",
    };
  }
}

export async function sendNewsletter(
  input: SendNewsletterInput
): Promise<SendNewsletterResult> {
  await requireAuth();

  const subject = input.subject.trim();
  if (!subject) {
    return { ok: false, sent: 0, failed: 0, errors: ["El asunto es obligatorio"] };
  }

  const html = input.html.trim();
  if (!html) {
    return { ok: false, sent: 0, failed: 0, errors: ["El contenido HTML es obligatorio"] };
  }

  const { config, sponsors } = await loadEventContext();
  const finalHtml = html.includes("<html")
    ? html
    : wrapCustomHtml(html, config);

  const { recipients } = resolveSponsorRecipients(sponsors, input.audience);
  if (recipients.length === 0) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      errors: ["No hay destinatarios con email válido para esta audiencia"],
    };
  }

  try {
    const { from } = assertResendReady();
    const resend = getResendClient();
    const errors: string[] = [];
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE);
      const payload = chunk.map((recipient) => ({
        from,
        to: [recipient.email],
        subject,
        html: finalHtml,
      }));

      const { error } = await resend.batch.send(payload);

      if (error) {
        failed += chunk.length;
        errors.push(error.message);
        continue;
      }

      sent += chunk.length;
    }

    return {
      ok: sent > 0 && failed === 0,
      sent,
      failed,
      errors,
    };
  } catch (err) {
    return {
      ok: false,
      sent: 0,
      failed: recipients.length,
      errors: [err instanceof Error ? err.message : "Error al enviar newsletter"],
    };
  }
}
