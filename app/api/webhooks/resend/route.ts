import { createSupabaseServer } from "@/lib/supabase/server";
import {
  eventTimestamp,
  statusFromResendEvent,
} from "@/lib/newsletter/campaigns";
import { verifyResendWebhook, type ResendWebhookEvent } from "@/lib/resend/webhook";
import type { NewsletterDeliveryStatus } from "@/types/newsletter";

const STATUS_RANK: Record<NewsletterDeliveryStatus, number> = {
  pending: 0,
  sent: 1,
  delayed: 2,
  delivered: 3,
  bounced: 3,
  failed: 3,
  cancelled: 4,
};

function buildDeliveryUpdate(event: ResendWebhookEvent) {
  const status = statusFromResendEvent(event.type);
  if (!status) return null;

  const at = eventTimestamp(event);
  const update: Record<string, unknown> = {
    status,
    last_event_at: at,
  };

  if (status === "sent") update.sent_at = at;
  if (status === "delivered") update.delivered_at = at;
  if (status === "bounced") {
    update.bounced_at = at;
    update.bounce_reason =
      event.data?.bounce?.message ??
      event.data?.bounce?.type ??
      "Rebote permanente";
  }
  if (status === "failed") update.failed_at = at;

  return update;
}

export async function POST(request: Request) {
  const payload = await request.text();

  let event: ResendWebhookEvent;
  try {
    event = verifyResendWebhook(payload, request.headers);
  } catch (err) {
    console.error("Resend webhook verification failed:", err);
    return Response.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const emailId = event.data?.email_id;
  if (!emailId) {
    return Response.json({ ok: true, ignored: true });
  }

  const supabase = createSupabaseServer();

  if (event.type === "email.opened") {
    const at = eventTimestamp(event);
    for (const table of ["newsletter_deliveries", "attendee_email_deliveries"] as const) {
      const { data: existing, error: fetchError } = await supabase
        .from(table)
        .select("opened_at")
        .eq("resend_email_id", emailId)
        .maybeSingle();

      if (fetchError) {
        console.error(`Failed to load ${table}:`, fetchError.message);
        continue;
      }
      if (!existing || existing.opened_at) continue;

      const { error } = await supabase
        .from(table)
        .update({ opened_at: at, last_event_at: at })
        .eq("resend_email_id", emailId);

      if (error) {
        console.error(`Failed to update ${table} open:`, error.message);
        return Response.json({ error: "Database update failed" }, { status: 500 });
      }

      return Response.json({ ok: true });
    }

    return Response.json({ ok: true, ignored: true });
  }

  const update = buildDeliveryUpdate(event);
  if (!update) {
    return Response.json({ ok: true, ignored: true });
  }

  for (const table of ["newsletter_deliveries", "attendee_email_deliveries"] as const) {
    const { data: existing, error: fetchError } = await supabase
      .from(table)
      .select("*")
      .eq("resend_email_id", emailId)
      .maybeSingle();

    if (fetchError) {
      console.error(`Failed to load ${table}:`, fetchError.message);
      continue;
    }

    if (!existing) continue;

    const currentStatus = existing.status as NewsletterDeliveryStatus;
    const nextStatus = update.status as NewsletterDeliveryStatus;
    if (STATUS_RANK[nextStatus] < STATUS_RANK[currentStatus]) {
      return Response.json({ ok: true, ignored: true });
    }

    const { error } = await supabase
      .from(table)
      .update(update)
      .eq("resend_email_id", emailId);

    if (error) {
      console.error(`Failed to update ${table}:`, error.message);
      return Response.json({ error: "Database update failed" }, { status: 500 });
    }

    if (
      table === "attendee_email_deliveries" &&
      nextStatus === "sent" &&
      existing.attendee_id &&
      existing.campaign_id
    ) {
      const { data: campaign, error: campaignError } = await supabase
        .from("attendee_email_campaigns")
        .select("scheduled_for")
        .eq("id", existing.campaign_id)
        .maybeSingle();
      if (campaignError) {
        console.error("Failed to load scheduled attendee campaign:", campaignError.message);
      } else if (campaign?.scheduled_for) {
        const { error: attendeeError } = await supabase
          .from("asistentes_potenciales")
          .update({
            estado: "Invitación enviada",
            ultimo_contacto: String(update.last_event_at).slice(0, 10),
            proxima_accion: "Dar seguimiento a la invitación",
          })
          .eq("id", existing.attendee_id)
          .in("estado", ["Lead", "Contactado"]);
        if (attendeeError) {
          console.error("Failed to mark scheduled attendee as invited:", attendeeError.message);
        }
      }
    }

    return Response.json({ ok: true });
  }

  return Response.json({ ok: true, ignored: true });
}
