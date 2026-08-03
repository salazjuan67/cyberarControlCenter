"use server";

import { requireAuth } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { mapAsistentePotencial } from "@/lib/supabase/mappers";
import {
  assertResendReady,
  getResendClient,
  getResendFromEmail,
  getResendFromEmailIssue,
  isResendConfigured,
} from "@/lib/resend/client";
import { normalizeNewsletterHtml } from "@/lib/newsletter/html";
import { resolveAttendeeRecipients } from "@/lib/asistentes/recipients";
import {
  buildAttendeeCampaignStats,
  mapAttendeeCampaign,
  mapAttendeeDelivery,
} from "@/lib/asistentes/campaigns";
import type {
  AttendeeEmailAudience,
  AttendeeEmailCampaign,
  AttendeeEmailCampaignDetail,
  AttendeeEmailHistoryEntry,
  AttendeeEmailPreview,
  AttendeeEmailStatus,
  SendAttendeeEmailInput,
  SendAttendeeEmailResult,
} from "@/types/asistentes";

const BATCH_SIZE = 100;

async function loadAsistentes() {
  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("asistentes_potenciales")
    .select("*")
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAsistentePotencial);
}

export async function getAttendeeEmailStatus(): Promise<AttendeeEmailStatus> {
  await requireAuth();
  const fromEmail = getResendFromEmail("attendees");
  return {
    configured: isResendConfigured() && Boolean(fromEmail),
    fromEmail,
    fromEmailWarning: getResendFromEmailIssue(fromEmail, "RESEND_FROM_EMAIL_ATTENDEES"),
  };
}

export async function previewAttendeeEmailRecipients(
  audience: AttendeeEmailAudience
): Promise<AttendeeEmailPreview> {
  await requireAuth();
  const asistentes = await loadAsistentes();
  const { recipients, skipped } = resolveAttendeeRecipients(asistentes, audience);
  return { audience, recipients, skipped };
}

export async function getAttendeeEmailCampaigns(): Promise<AttendeeEmailCampaign[]> {
  await requireAuth();
  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("attendee_email_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAttendeeCampaign);
}

export async function getAttendeeEmailCampaignDetail(
  campaignId: string
): Promise<AttendeeEmailCampaignDetail | null> {
  await requireAuth();
  const supabase = createSupabaseServer();

  const { data: campaignRow, error: campaignError } = await supabase
    .from("attendee_email_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaignError) throw new Error(campaignError.message);
  if (!campaignRow) return null;

  const campaign = mapAttendeeCampaign(campaignRow);
  const { data: deliveries, error: deliveriesError } = await supabase
    .from("attendee_email_deliveries")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("organizacion", { ascending: true });
  if (deliveriesError) throw new Error(deliveriesError.message);

  const mappedDeliveries = (deliveries ?? []).map(mapAttendeeDelivery);
  return {
    campaign,
    stats: buildAttendeeCampaignStats(campaign, mappedDeliveries),
    deliveries: mappedDeliveries,
  };
}

export async function getAttendeeEmailHistory(
  attendeeId: string,
  email?: string
): Promise<AttendeeEmailHistoryEntry[]> {
  await requireAuth();
  const supabase = createSupabaseServer();

  let query = supabase
    .from("attendee_email_deliveries")
    .select(
      "id, campaign_id, recipient_email, status, sent_at, delivered_at, bounced_at, bounce_reason"
    )
    .order("sent_at", { ascending: false, nullsFirst: false });

  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) {
    query = query.or(`attendee_id.eq.${attendeeId},recipient_email.eq.${normalizedEmail}`);
  } else {
    query = query.eq("attendee_id", attendeeId);
  }

  const { data: deliveries, error } = await query.limit(50);
  if (error) throw new Error(error.message);
  if (!deliveries?.length) return [];

  const campaignIds = [...new Set(deliveries.map((row) => row.campaign_id as string))];
  const { data: campaigns, error: campaignsError } = await supabase
    .from("attendee_email_campaigns")
    .select("id, subject, created_at")
    .in("id", campaignIds);
  if (campaignsError) throw new Error(campaignsError.message);

  const campaignMap = new Map(
    (campaigns ?? []).map((row) => [
      row.id as string,
      { subject: row.subject as string, createdAt: row.created_at as string },
    ])
  );

  return deliveries.map((row) => {
    const campaign = campaignMap.get(row.campaign_id as string);
    return {
      deliveryId: row.id as string,
      campaignId: row.campaign_id as string,
      subject: campaign?.subject ?? "Comunicación",
      campaignDate: campaign?.createdAt ?? "",
      recipientEmail: row.recipient_email as string,
      status: row.status as AttendeeEmailHistoryEntry["status"],
      sentAt: (row.sent_at as string) ?? "",
      deliveredAt: (row.delivered_at as string) ?? "",
      bouncedAt: (row.bounced_at as string) ?? "",
      bounceReason: (row.bounce_reason as string) ?? "",
    };
  });
}

export async function sendAttendeeEmail(
  input: SendAttendeeEmailInput
): Promise<SendAttendeeEmailResult> {
  await requireAuth();

  const subject = input.subject.trim();
  if (!subject) {
    return { ok: false, sent: 0, failed: 0, errors: ["El asunto es obligatorio"] };
  }

  const html = normalizeNewsletterHtml(input.html.trim());
  if (!html) {
    return { ok: false, sent: 0, failed: 0, errors: ["El contenido HTML es obligatorio"] };
  }

  const asistentes = await loadAsistentes();
  const { recipients } = resolveAttendeeRecipients(asistentes, input.audience);
  if (recipients.length === 0) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      errors: ["No hay destinatarios con email válido para esta audiencia"],
    };
  }

  const campaignId = `aec${Date.now()}`;
  const supabase = createSupabaseServer();

  try {
    const { from } = assertResendReady("attendees");
    const resend = getResendClient();
    const errors: string[] = [];
    let sent = 0;
    let failed = 0;

    const { error: campaignError } = await supabase.from("attendee_email_campaigns").insert({
      id: campaignId,
      subject,
      audience: input.audience,
      from_email: from,
      total_recipients: recipients.length,
      sent_count: 0,
      failed_count: 0,
    });
    if (campaignError) throw new Error(campaignError.message);

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE);
      const payload = chunk.map((recipient) => ({
        from,
        to: [recipient.email],
        subject,
        html,
        tags: [{ name: "campaign_id", value: campaignId }],
      }));

      const { data, error } = await resend.batch.send(payload);

      if (error) {
        failed += chunk.length;
        errors.push(error.message);
        const failedRows = chunk.map((recipient, index) => ({
          id: `${campaignId}-d${i + index}`,
          campaign_id: campaignId,
          resend_email_id: null,
          attendee_id: recipient.attendeeId,
          recipient_email: recipient.email,
          recipient_name: recipient.name,
          organizacion: recipient.organizacion,
          status: "failed",
          failed_at: new Date().toISOString(),
          last_event_at: new Date().toISOString(),
        }));
        await supabase.from("attendee_email_deliveries").insert(failedRows);
        continue;
      }

      const emailIds = data?.data ?? [];
      const deliveryRows = chunk.map((recipient, index) => {
        const resendEmailId = emailIds[index]?.id ?? null;
        const accepted = Boolean(resendEmailId);
        if (accepted) sent += 1;
        else failed += 1;

        return {
          id: `${campaignId}-d${i + index}`,
          campaign_id: campaignId,
          resend_email_id: resendEmailId,
          attendee_id: recipient.attendeeId,
          recipient_email: recipient.email,
          recipient_name: recipient.name,
          organizacion: recipient.organizacion,
          status: accepted ? "sent" : "failed",
          sent_at: accepted ? new Date().toISOString() : null,
          failed_at: accepted ? null : new Date().toISOString(),
          last_event_at: new Date().toISOString(),
        };
      });

      const { error: insertError } = await supabase
        .from("attendee_email_deliveries")
        .insert(deliveryRows);
      if (insertError) errors.push(insertError.message);
    }

    await supabase
      .from("attendee_email_campaigns")
      .update({ sent_count: sent, failed_count: failed })
      .eq("id", campaignId);

    return { ok: sent > 0, sent, failed, errors, campaignId };
  } catch (err) {
    return {
      ok: false,
      sent: 0,
      failed: recipients.length,
      errors: [err instanceof Error ? err.message : "Error al enviar comunicación"],
      campaignId,
    };
  }
}

export async function sendAttendeeTestEmail(input: {
  subject: string;
  html: string;
  to: string;
}): Promise<{ ok: boolean; error?: string; emailId?: string; hint?: string }> {
  await requireAuth();
  const to = input.to.trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: "Email de prueba inválido" };
  }

  try {
    const { from } = assertResendReady("attendees");
    const resend = getResendClient();
    const html = normalizeNewsletterHtml(input.html);
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: `[Prueba] ${input.subject}`,
      html,
    });
    if (error) return { ok: false, error: error.message };
    if (!data?.id) {
      return { ok: false, error: "Resend no devolvió un ID de envío." };
    }
    return {
      ok: true,
      emailId: data.id,
      hint: "Si no llega, revisá spam y que info@cyberar.fie.undef.edu.ar esté verificado en Resend.",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al enviar prueba",
    };
  }
}
